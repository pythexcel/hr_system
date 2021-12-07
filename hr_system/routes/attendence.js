const express = require("express");
const router = express.Router();
const validators = require("../validators/req-validators");
const attendanceControllers = require("../controllers/attendence-Controller");
const handlers = require("../util/responseHandlers");
const middleware = require("../middleware/Auth");

router.post(
  "/get_user_timesheet",
  middleware.AuthForHrEmployee,
  attendanceControllers.get_user_timesheet,
  handlers.responseForInventory
);

router.post(
  "/user_timesheet_entry",
  middleware.AuthForHrEmployee,
  attendanceControllers.user_timesheet_entry,
  handlers.responseForInventory
);

router.post(
  "/submit_timesheet",
  middleware.AuthForHrEmployee,
  attendanceControllers.submit_timesheet,
  handlers.responseForInventory
);

router.post(
    "/month_attendance",
    middleware.AuthForHrEmployee,
    attendanceControllers.month_attendance,
    handlers.responseForEmployee
  );

module.exports=router;