"use strict";

const { sequelize } = require("../config/database");

// ─────────────────────────────────
// CORE MODELS
// ─────────────────────────────────
const HrisUser = require("./auth/models/core/hris_user");
const Role = require("./hris/models/core/role");
const RolePermission = require("./hris/models/core/role_permissions");
const Employee = require("./hris/models/core/employee");
const Department = require("./hris/models/core/department");
const PasswordResetToken = require("./auth/models/core/passwordResettokens");
const RefreshToken = require("./auth/models/core/refreshTokens");
const LoginAttempt = require("./auth/models/core/loginAttempts");

// ─────────────────────────────────
// PAYROLL MODELS
// ─────────────────────────────────
const PayrollCutoff = require("./hris/models/payroll/payrollCutoff");
const CompensationPackage = require("./hris/models/payroll/compensationPackage");
const EmployeeCompensation = require("./hris/models/payroll/employeeCompensation");
const SalaryHistory = require("./hris/models/payroll/salaryHistory");
const PayrollAdjustment = require("./hris/models/payroll/payrollAdjustment");
const Payslip = require("./hris/models/payroll/payslip");

// ─────────────────────────────────
// ATTENDANCE MODELS
// ─────────────────────────────────
const AttendanceRecord = require("./hris/models/attendance/attendanceRecord");
const AttendanceCorrection = require("./hris/models/attendance/attendanceCorrection");
const OtUtRecord = require("./hris/models/attendance/otUtRecord");

// ─────────────────────────────────
// LEAVE MODELS
// ─────────────────────────────────
const LeaveType = require("./hris/models/leave/leaveType");
const LeaveBalance = require("./hris/models/leave/leaveBalance");
const LeaveRequest = require("./hris/models/leave/leaveRequest");

// ─────────────────────────────────
// OFFSET
// ─────────────────────────────────
const Offset = require("./hris/models/offset/offset");

// ─────────────────────────────────
// RECRUITMENT
// ─────────────────────────────────
const JobOpening = require("./hris/models/recruitment/jobOpening");
const PipelineStage = require("./hris/models/recruitment/pipelineStage");
const Candidate = require("./hris/models/recruitment/candidate");
const Application = require("./hris/models/recruitment/application");
const ApplicationStageHistory = require("./hris/models/recruitment/applicationStageHistory");
const Interview = require("./hris/models/recruitment/interview");
const Offer = require("./hris/models/recruitment/offer");
const OnboardingChecklist = require("./hris/models/recruitment/onboardingChecklist");
const OnboardingTaskTemplate = require("./hris/models/recruitment/onboardingTaskTemplate");
const OnboardingTask = require("./hris/models/recruitment/onboardingTask");

// ─────────────────────────────────
// TASKS
// ─────────────────────────────────
const Project = require("./hris/models/task/project");
const ProjectMember = require("./hris/models/task/projectMember");
const Task = require("./hris/models/task/task");
const TaskTag = require("./hris/models/task/taskTag");
const TaskTagAssignment = require("./hris/models/task/taskTagAssignment");
const TaskTimeLog = require("./hris/models/task/taskTimeLog");

// ─────────────────────────────────
// OTHER
// ─────────────────────────────────
const CompanyProfile = require("./hris/models/company/profile");
const LogsHistory = require("./hris/models/logs/history");

const BookingAppointment = require("./booking/models/bookingAppointment");
const BookingBlockedDate = require("./booking/models/bookingBlockedDate");
const BookingBlockedRange = require("./booking/models/bookingBlockedRange");
const BookingOpenDate = require("./booking/models/bookingOpenDate");
const BookingPackage = require("./booking/models/bookingPackage");
const BookingPackageAddon = require("./booking/models/bookingPackageAddon");
const BookingPackageInclusion = require("./booking/models/bookingPackageInclusion");
const BookingTimeBlock = require("./booking/models/bookingTimeBlock");

// ─────────────────────────────────
// RELATIONSHIPS
// ─────────────────────────────────

// CORE
Employee.belongsTo(Department, { foreignKey: "department_id" });
Department.hasMany(Employee, { foreignKey: "department_id" });

HrisUser.belongsTo(Employee, { foreignKey: "employee_id" });
Employee.hasOne(HrisUser, { foreignKey: "employee_id" });

Department.belongsTo(Employee, { as: "head", foreignKey: "head_id" });
Employee.hasMany(Department, { foreignKey: "head_id" });

Employee.belongsTo(Employee, { as: "manager", foreignKey: "manager_id" });

RefreshToken.belongsTo(Employee, { foreignKey: "employee_id" });
PasswordResetToken.belongsTo(Employee, { foreignKey: "employee_id" });

Employee.hasMany(LoginAttempt, { foreignKey: "employee_id" });
LoginAttempt.belongsTo(Employee, { foreignKey: "employee_id" });

// ROLE
Role.hasMany(RolePermission, { foreignKey: "role_id" });
RolePermission.belongsTo(Role, { foreignKey: "role_id" });

HrisUser.belongsTo(Role, { foreignKey: "role_id" });
Role.hasMany(HrisUser, { foreignKey: "role_id" });

// PAYROLL
Employee.hasMany(EmployeeCompensation, { foreignKey: "employee_id" });
EmployeeCompensation.belongsTo(Employee, { foreignKey: "employee_id" });

CompensationPackage.hasMany(EmployeeCompensation, {
  foreignKey: "compensation_package_id",
});
EmployeeCompensation.belongsTo(CompensationPackage, {
  foreignKey: "compensation_package_id",
});

Employee.hasMany(SalaryHistory, { foreignKey: "employee_id" });
SalaryHistory.belongsTo(Employee, { foreignKey: "employee_id" });

Employee.hasMany(PayrollAdjustment, { foreignKey: "employee_id" });
PayrollAdjustment.belongsTo(Employee, { foreignKey: "employee_id" });

PayrollCutoff.hasMany(PayrollAdjustment, { foreignKey: "payroll_cutoff_id" });
PayrollAdjustment.belongsTo(PayrollCutoff, { foreignKey: "payroll_cutoff_id" });

Employee.hasMany(Payslip, { foreignKey: "employee_id" });
Payslip.belongsTo(Employee, { foreignKey: "employee_id" });

PayrollCutoff.hasMany(Payslip, { foreignKey: "payroll_cutoff_id" });
Payslip.belongsTo(PayrollCutoff, { foreignKey: "payroll_cutoff_id" });

// ATTENDANCE
Employee.hasMany(AttendanceRecord, { foreignKey: "employee_id" });
AttendanceRecord.belongsTo(Employee, { foreignKey: "employee_id" });

AttendanceRecord.hasMany(AttendanceCorrection, {
  foreignKey: "attendance_record_id",
});
AttendanceCorrection.belongsTo(AttendanceRecord, {
  foreignKey: "attendance_record_id",
});

Employee.hasMany(AttendanceCorrection, { foreignKey: "employee_id" });
AttendanceCorrection.belongsTo(Employee, { foreignKey: "employee_id" });

Employee.hasMany(OtUtRecord, { foreignKey: "employee_id" });
OtUtRecord.belongsTo(Employee, { foreignKey: "employee_id" });

// LEAVE
LeaveType.hasMany(LeaveBalance, { foreignKey: "leave_type_id" });
LeaveBalance.belongsTo(LeaveType, { foreignKey: "leave_type_id" });

LeaveType.hasMany(LeaveRequest, { foreignKey: "leave_type_id" });
LeaveRequest.belongsTo(LeaveType, { foreignKey: "leave_type_id" });

Employee.hasMany(LeaveBalance, { foreignKey: "employee_id" });
LeaveBalance.belongsTo(Employee, { foreignKey: "employee_id" });

Employee.hasMany(LeaveRequest, { foreignKey: "employee_id" });
LeaveRequest.belongsTo(Employee, { foreignKey: "employee_id" });

// RECRUITMENT
JobOpening.hasMany(PipelineStage, { foreignKey: "job_opening_id" });
PipelineStage.belongsTo(JobOpening, { foreignKey: "job_opening_id" });

Candidate.hasMany(Application, { foreignKey: "candidate_id" });
Application.belongsTo(Candidate, { foreignKey: "candidate_id" });

JobOpening.hasMany(Application, { foreignKey: "job_opening_id" });
Application.belongsTo(JobOpening, { foreignKey: "job_opening_id" });

Application.hasMany(ApplicationStageHistory, { foreignKey: "application_id" });
ApplicationStageHistory.belongsTo(Application, {
  foreignKey: "application_id",
});

PipelineStage.hasMany(ApplicationStageHistory, {
  foreignKey: "pipeline_stage_id",
});
ApplicationStageHistory.belongsTo(PipelineStage, {
  foreignKey: "pipeline_stage_id",
});

Application.hasMany(Interview, { foreignKey: "application_id" });
Interview.belongsTo(Application, { foreignKey: "application_id" });

Application.hasOne(Offer, { foreignKey: "application_id" });
Offer.belongsTo(Application, { foreignKey: "application_id" });

// TASKS
Project.hasMany(ProjectMember, { foreignKey: "project_id" });
ProjectMember.belongsTo(Project, { foreignKey: "project_id" });

Employee.hasMany(ProjectMember, { foreignKey: "employee_id" });
ProjectMember.belongsTo(Employee, { foreignKey: "employee_id" });

Project.hasMany(Task, { foreignKey: "project_id" });
Task.belongsTo(Project, { foreignKey: "project_id" });

Employee.hasMany(Task, { foreignKey: "assigned_to" });
Task.belongsTo(Employee, { foreignKey: "assigned_to" });

// ─────────────────────────────────
// BOOKING SYSTEM
// ─────────────────────────────────

// Booking Package relations
BookingPackage.hasMany(BookingPackageAddon, {
  foreignKey: "package_id",
  sourceKey: "id",
});

BookingPackageAddon.belongsTo(BookingPackage, {
  foreignKey: "package_id",
  targetKey: "id",
});

BookingPackage.hasMany(BookingPackageInclusion, {
  foreignKey: "package_id",
  sourceKey: "id",
});

BookingPackageInclusion.belongsTo(BookingPackage, {
  foreignKey: "package_id",
  targetKey: "id",
});

// Appointment relations
BookingAppointment.belongsTo(BookingPackage, {
  foreignKey: "service_id",
  targetKey: "id",
});

// Optional: if you later normalize addons properly
// BookingAppointment.belongsToMany(BookingPackageAddon, {
//   through: "booking_appointment_addons",
//   foreignKey: "appointment_id",
// });

// Blocked / Availability system (standalone tables, no relations needed)

// ─────────────────────────────────
// EXPORT
// ─────────────────────────────────
module.exports = {
  sequelize,

  HrisUser,
  Role,
  RolePermission,
  Employee,
  Department,
  PasswordResetToken,
  RefreshToken,
  LoginAttempt,

  PayrollCutoff,
  CompensationPackage,
  EmployeeCompensation,
  SalaryHistory,
  PayrollAdjustment,
  Payslip,

  AttendanceRecord,
  AttendanceCorrection,
  OtUtRecord,

  LeaveType,
  LeaveBalance,
  LeaveRequest,

  Offset,

  JobOpening,
  PipelineStage,
  Candidate,
  Application,
  ApplicationStageHistory,
  Interview,
  Offer,
  OnboardingChecklist,
  OnboardingTaskTemplate,
  OnboardingTask,

  Project,
  ProjectMember,
  Task,
  TaskTag,
  TaskTagAssignment,
  TaskTimeLog,

  CompanyProfile,
  LogsHistory,

  BookingAppointment,
  BookingBlockedDate,
  BookingBlockedRange,
  BookingOpenDate,
  BookingPackage,
  BookingPackageAddon,
  BookingPackageInclusion,
  BookingTimeBlock,
};
