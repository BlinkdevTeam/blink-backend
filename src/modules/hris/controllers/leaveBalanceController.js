"use strict";

const {
  sequelize,
  Employee,
  LeaveType,
  LeaveBalance,
} = require("../../../models");

// UI key -> leave_types row. Rename here if your table uses different names.
const TYPES = {
  annual: { name: "Annual Leave", days: 15 },
  sick: { name: "Sick Leave", days: 15 },
  emergency: { name: "Emergency Leave", days: 5 },
};
const KEY_BY_NAME = Object.fromEntries(
  Object.entries(TYPES).map(([key, t]) => [t.name, key]),
);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const parseYear = (value) => {
  const year = value === undefined ? new Date().getFullYear() : Number(value);
  return Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : null;
};

// Rows (one per leave type) -> [{ empId, annual:{total,used}, sick, emergency }]
function group(rows) {
  const byEmp = {};
  for (const r of rows) {
    const key = KEY_BY_NAME[r.LeaveType?.name];
    if (!key) continue;
    byEmp[r.employee_id] ??= {
      empId: r.employee_id,
      annual: { total: 0, used: 0 },
      sick: { total: 0, used: 0 },
      emergency: { total: 0, used: 0 },
    };
    byEmp[r.employee_id][key] = {
      total: r.allocated_days,
      used: r.used_days,
    };
  }
  return Object.values(byEmp);
}

const findRows = (where, transaction) =>
  LeaveBalance.findAll({
    where,
    include: [{ model: LeaveType, attributes: ["id", "name"] }],
    transaction,
  });

// GET /api/leave-balances?year=2026
exports.getLeaveBalances = async (req, res) => {
  try {
    const year = parseYear(req.query.year);
    if (!year) return res.status(400).json({ message: "Invalid year" });

    const rows = await findRows({ year });
    return res.json({ success: true, data: group(rows) });
  } catch (err) {
    console.error("[getLeaveBalances]", err);
    return res.status(500).json({ message: "Failed to fetch leave balances" });
  }
};

// PUT /api/leave-balances/:employeeId
// body: { year, annual, sick, emergency }  (allocated days per type)
exports.saveLeaveBalance = async (req, res) => {
  const { employeeId } = req.params;
  const year = parseYear(req.body?.year);

  if (!UUID_RE.test(employeeId)) {
    return res.status(400).json({ message: "Invalid employee id" });
  }
  if (!year) return res.status(400).json({ message: "Invalid year" });

  const allocations = {};
  for (const key of Object.keys(TYPES)) {
    const value = Number(req.body?.[key]);
    if (!Number.isInteger(value) || value < 0 || value > 365) {
      return res.status(400).json({
        message: `${TYPES[key].name} must be a whole number between 0 and 365`,
      });
    }
    allocations[key] = value;
  }

  const employee = await Employee.findByPk(employeeId, {
    attributes: ["id"],
  });
  if (!employee) return res.status(404).json({ message: "Employee not found" });

  const transaction = await sequelize.transaction();
  try {
    for (const [key, allocated] of Object.entries(allocations)) {
      const [leaveType] = await LeaveType.findOrCreate({
        where: { name: TYPES[key].name },
        defaults: { days_per_year: TYPES[key].days, is_paid: true },
        transaction,
      });

      const existing = await LeaveBalance.findOne({
        where: {
          employee_id: employeeId,
          leave_type_id: leaveType.id,
          year,
        },
        transaction,
      });

      if (existing) {
        if (allocated < existing.used_days) {
          await transaction.rollback();
          return res.status(400).json({
            message: `${TYPES[key].name}: allocated days can't be less than the ${existing.used_days} already used`,
          });
        }
        await existing.update(
          {
            allocated_days: allocated,
            remaining_days: allocated - existing.used_days,
          },
          { transaction },
        );
      } else {
        await LeaveBalance.create(
          {
            employee_id: employeeId,
            leave_type_id: leaveType.id,
            year,
            allocated_days: allocated,
            used_days: 0,
            remaining_days: allocated,
          },
          { transaction },
        );
      }
    }

    await transaction.commit();

    const rows = await findRows({ employee_id: employeeId, year });
    return res.json({ success: true, data: group(rows)[0] });
  } catch (err) {
    if (!transaction.finished) await transaction.rollback();
    console.error("[saveLeaveBalance]", err);
    return res.status(500).json({ message: "Failed to save leave balance" });
  }
};
