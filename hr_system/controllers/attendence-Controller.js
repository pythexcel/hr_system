const db = require("../db");
const providers = require("../providers/creation-provider");
const reqValidate = require("../providers/error-check");
const jwt = require("jsonwebtoken");
const secret = require("../config");
const {getAllUserPrevMonthTime,updateDayWorkingHours}=require("../attendaceFunctions");
exports.month_attendance = async (req, res, next) => {
  try{
  let userid = req.body["userid"];
  let year = req.body["year"];
  let month = req.body["month"];
  let response = await getUserMonthAttendaceComplete(userid, year, month, db);
  res.status_code=200;
  res.data=response;
  return next();
  }catch(error){
    console.log(error)
    res.status_code=500;
    res.message=error;
    return next();
  }
};
exports.get_all_user_previous_month_time = async (req, res, next) => {
  try{
    let year =req.body['year'];
    let month =req.body['month'];
    let resp =await getAllUserPrevMonthTime(year,month,db);  
    res.status_code=200;
    res.data=resp.data;
    res.error=resp.error;
    res.message=resp.message;
    return next();
  }catch(error){
    console.log(error);
    res.status_code=500;
    res.message=error;
    return next();
  }
};

exports.update_day_working_hours = async (req, res, next) => {
  try{
   let date = req.body['date'];
   let time = req.body['time'];
   let resp = await updateDayWorkingHours(date,time,db);
    res.status_code=200;
    res.data=resp.data;
    res.error=resp.error;
    res.message=resp.message;
    return next();
  }catch(error){
    console.log(error);
    res.status_code=500;
    res.message=error;
    return next();
  }
};
