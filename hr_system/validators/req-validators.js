const { check } = require("express-validator");

const userCreationValidator = [
  check("password", "password must not be empty").not().isEmpty(),
  check("username", "username must not be empty").not().isEmpty(),
  check("type", "type must not be empty").not().isEmpty(),
  check("status", "status must not be empty").not().isEmpty(),
];

const userLoginValidator = [
  check("password", "password must not be empty").not().isEmpty(),
  check("username", "username must not be empty").not().isEmpty(),
];

const machineCreationValidator = [
  check("machine_type", "machine_type must not be empty").not().isEmpty(),
  check("machine_name", "machine_name must not be empty").not().isEmpty(),
  check("serial_number", "serial_no must not be empty").not().isEmpty(),
  check("status", "status must not be empty").not().isEmpty(),
];

const inventoryAuditValidator = [
  check("inventory_id", "inventory_id must not be empty").not().isEmpty(),
];

const AssignUserMachineValidator = [
  check("user_id", "user_id must not be empty").not().isEmpty(),
  check("machine_id", "machine_id must not be empty").not().isEmpty(),
];

const UpdateMachineValidator = [
  check("serial_no", "serial_no must not be empty").not().isEmpty(),
];

const MachineStatusValidator = [
  check("status", "status must not be empty").not().isEmpty(),
];

const MachineStatusDeleteValidator = [
  check("id", "id must not be empty").not().isEmpty(),
];

const addMachineTypeValidator = [
  check("type", "type must not be empty").not().isEmpty(),
];

const unassignRequestValidator = [
  check("inventory_id", "inventory_id must not be empty").not().isEmpty(),
];

const addRoleValidator = [
	check('name', 'name must not be empty').not().isEmpty(),
	check('description', 'description must not be empty').not().isEmpty()
];

const addNewEmployeeValidator = [
  check('name', 'name must not be empty').not().isEmpty(),
  check('username', 'username must not be empty').not().isEmpty(),
  check('jobtitle', 'jobtitle must not be empty').not().isEmpty(),
  check('workemail', 'workemail must not be empty').not().isEmpty(),
];

const assignUserRoleValidator = [
  check('user_id', 'user_id must not be empty').not().isEmpty(),
  check('role_id', 'role_id must not be empty').not().isEmpty(),
]

const updateRoleValidators = [
  check('role_id', 'role_id must not be empty').not().isEmpty(),
  check('action_id', 'action_id must not be empty').not().isEmpty(),
  check('page_id', 'page_id must not be empty').not().isEmpty(),
  check('notification_id', 'notification_id must not be empty').not().isEmpty(),
]

module.exports = {
  userCreationValidator,
  userLoginValidator,
  machineCreationValidator,
  inventoryAuditValidator,
  AssignUserMachineValidator,
  UpdateMachineValidator,
  MachineStatusValidator,
  MachineStatusDeleteValidator,
  addMachineTypeValidator,
  unassignRequestValidator,
  addRoleValidator,
  addNewEmployeeValidator,
  assignUserRoleValidator,
  updateRoleValidators
};
