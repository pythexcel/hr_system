const {
    PAGE_login,
    PAGE_logout,
    PAGE_my_inventory,
    PAGE_policy_documents,
    getAllPages,
    getAllActions,
  } = require("./roles");
  const md5=require("md5")
  const jwt = require("jsonwebtoken");
  const secret = require("./config.json");
  const {Op,QueryTypes, json } = require("sequelize");
  const db = require("./db");
  const { sequelize } = require("./db");
  const { MachineStatusDeleteValidator } = require("./validators/req-validators");
const { getUserInfo, copyExistingRoleRightsToNewRole } = require("./allFunctions");
const elc_stages_step = require("./models/elc_stages_stepModel");
const { object } = require("webidl-conversions");

  
  let getUserDetailInfo = async (userid,req,models) => {
    try {
      let r_error = 1;
      let r_message = "";
      let r_data = {};
      user_bank_detail = await getUserBankDetail(userid,req,models);
      user_profile_detail =await getUserprofileDetail(userid,req,models);
      user_assign_machine = await getUserAssignMachines(userid,req,models);
      Return={};
      r_error=0;
      Return.error=r_error;
      Return.data={};
      Return.data.user_profile_detail=user_profile_detail ;
      Return.data.user_bank_detail=user_bank_detail;
      Return.data.user_assign_machine=user_assign_machine;
      return Return;
    } catch (error) {
       console.log(error)
    }
  };

  let getUserBankDetail= async (userid,req,models)=>{
  let query=await models.sequelize.query(`SELECT * FROM user_bank_details WHERE user_Id = ${userid}`,{type:QueryTypes.SELECT});
   let arr="";
   arr=query;
   return arr;
  }
  let getUserprofileDetail = async (userid,req,models)=>{
    let isAdmin="";
      let query=await models.sequelize.query(`SELECT users.status, users.username,
       users.type, user_profile.* FROM users 
      LEFT JOIN user_profile ON users.id = user_profile.user_Id where users.status = 'Enabled' AND 
      users.id = ${userid}`,{type:QueryTypes.SELECT})
      if(isAdmin===""){
      delete query[0].holding_comments;
      }
       // addition on 21st june 2018 by arun to return profile image also. i.e slack image
      //  $slack_image = "";
      //  $allSlackUsers = self::getSlackUsersList();
      //  foreach ($allSlackUsers as $s) {
      //      if ($s['profile']['email'] == $row['work_email']) {
      //          $sl = $s;
      //          break;
      //      }
      //  }
      //  if (!isset($sl) || is_null($sl) ) {
      //      $row['slack_profile'] = $sl; 
      //  }
      //  $row['profileImage'] = HR::_getEmployeeProfilePhoto($row);
      let arr="";
      arr = query;
      return arr;

  }
  let  getUserAssignMachines=async(userid,req,models)=>{
    let query=await models.sequelize.query(`select machines_list.id, machines_list.machine_type,machines_list.machine_name,machines_list.mac_address,machines_list.serial_number, machines_list.bill_number, machines_user.user_Id,machines_user.assign_date from machines_list 
    left join machines_user on machines_list.id = machines_user.machine_id where machines_user.user_Id = ${userid}`,{type:QueryTypes.SELECT})
    return query;
  }
  let getEnabledEmployeesBriefDetails= async(req,models)=>{
    let users=await getEnabledUsersListWithoutPass(req,models);
    return users;
  }
let getEnabledUsersListWithoutPass=async(req,models,role=false,sorted_by=false)=>{
let row=await getEnabledUsersList(req,models,sorted_by);
let secureKeys = [ 'bank_account_num', 'blood_group', 'address1', 'address2', 'emergency_ph1', 'emergency_ph2', 'medical_condition', 'dob', 'marital_status', 'city', 'state', 'zip_postal', 'country', 'home_ph', 'mobile_ph', 'work_email', 'other_email', 'special_instructions', 'pan_card_num', 'permanent_address', 'current_address', 'slack_id', 'policy_document', 'training_completion_date', 'termination_date', 'training_month', 'slack_msg', 'signature', 'role_id', 'role_name', 'eth_token' ]
let rows=[];
for(let val of row){
  delete val.password;
  if(role.toString().toLowerCase()=='guest'){
    for(let[key,value] of Object.entries(val) ){
      for(let secureKey of secureKeys){
        if(key==secureKey){
          delete val.key;
        }
      }
    }
  }
  rows.push(val);
}
Return={};
Return.error=0;
Return.data=row;
return Return;
}
let getEnabledUsersList=async(req,models,sorted_by=false)=>{
  let isAdmin="";
let query;
  if(sorted_by=='salary'){
 query=await models.sequelize.query(`SELECT
 users.*,
 user_profile.*,
 salary.total_salary,
 roles.id as role_id,
 roles.name as role_name
 FROM users
 LEFT JOIN user_profile ON users.id = user_profile.user_id
 LEFT JOIN user_roles ON users.id = user_roles.user_id
 LEFT JOIN roles ON user_roles.role_id = roles.id
 LEFT JOIN ( SELECT "user_Id", MAX(total_salary) as total_salary FROM salary GROUP BY "user_Id" ) as salary ON users.id = salary."user_Id"
 where
 users.status = 'Enabled' ORDER BY salary.total_salary DESC`,{type:QueryTypes.SELECT})
  }else if(sorted_by=='dateofjoining'){
    query=await models.sequelize.query(`SELECT
    users.*,
    user_profile.*,
    roles.id as role_id,
    roles.name as role_name
    FROM users
    LEFT JOIN user_profile ON users.id = user_profile.user_id
    LEFT JOIN user_roles ON users.id = user_roles.user_id
    LEFT JOIN roles ON user_roles.role_id = roles.id
    where
    users.status = 'Enabled' ORDER BY user_profile.dateofjoining ASC`,{type:QueryTypes.SELECT})
  }else{
    query= await models.sequelize.query(`SELECT
    users.*,
    user_profile.*,
    roles.id as role_id,
    roles.name as role_name
    FROM users
    LEFT JOIN user_profile ON users.id = user_profile.user_Id
    LEFT JOIN user_roles ON users.id = user_roles.user_id
    LEFT JOIN roles ON user_roles.role_id = roles.id
    where
    users.status = 'Enabled'`,{type:QueryTypes.SELECT})
  }
  let newRows=[];
  for(let pp of query){
    delete pp.total_salary;
    if(isAdmin===""){
      delete pp.holding_comments;
    }
    pp.slack_profile=[];
    newRows.push(pp);
  }
  // $slackUsersList = self::getSlackUsersList();
  // if (sizeof($slackUsersList) > 0) {
  //   foreach ($newRows as $key => $pp) {
  //       $pp_work_email = $pp['work_email'];
  //       $userid = $pp['user_Id'];
  //       foreach ($slackUsersList as $sl) {
  //           if ($sl['profile']['email'] == $pp_work_email) {
  //               $newRows[$key]['slack_profile'] = $sl['profile'];
  //               $newRows[$key]['slack_channel_id'] = $sl['slack_channel_id'];
  //               $slack_id = $sl['id'];
  //               $slack_profile_image = $sl['profile']['image_original'];
  //               $q = "SELECT * FROM user_profile where user_Id = $userid ";

  //               $runQuery = self::DBrunQuery($q);
  //               $row = self::DBfetchRow($runQuery);
  //               $no_of_rows = self::DBnumRows($runQuery);

  //               if ($no_of_rows > 0) {
  //                   if ($row['slack_id'] == "") {
  //                       $q2 = "UPDATE user_profile SET slack_id = '$slack_id' WHERE user_Id = $userid ";
  //                       $runQuery2 = self::DBrunQuery($q2);
  //                   }
  //                   if( $row['image'] == "" || $row['image'] != $slack_profile_image ){
  //                       $q2 = "UPDATE user_profile SET image = '$slack_profile_image' WHERE user_Id = $userid ";
  //                       $runQuery2 = self::DBrunQuery($q2);
  //                   }
  //                   // if ($row['unique_key'] == "") {
  //                   //     $bytes = uniqid();
  //                   //     $q2 = "UPDATE user_profile SET unique_key = '$bytes' WHERE user_Id = $userid ";
  //                   //     $runQuery2 = self::DBrunQuery($q2);
  //                   // }
  //               }

  //               $newRows[$key]['slack_profile']['image_72'] = $row['image'] ? $row['image'] : $slack_profile_image;
  //               $newRows[$key]['slack_profile']['image_192'] = $row['image'] ? $row['image'] : $slack_profile_image;

  //               break;
//             }
//         }
//     }
// }
// if( sizeof($newRows) > 0 ){
//   foreach ($newRows as $key => $value) {
//       $newRows[$key]['profileImage'] = self::_getEmployeeProfilePhoto($value);
//   }
// }
return newRows;
}
let getDisabledUser=async(req,models)=>{
  let query= await models.sequelize.query(`SELECT
  users.*,
  user_profile.*,
  roles.id as role_id,
  roles.name as role_name
  FROM users
  LEFT JOIN user_profile ON users.id = user_profile."user_Id"
  LEFT JOIN user_roles ON users.id = user_roles.user_id
  LEFT JOIN roles ON user_roles.role_id = roles.id
  where
  users.status = 'Disabled'`,{type:QueryTypes.SELECT})
  Return={};
  if(query.length!==0){
    Return.error=0;
    Return.data=query;
  }else{
  Return.message="No disabled User found !!"
  }
  return Return;
}
let getUserDocumentDetail=async(userid,req,models)=>{
  let r_error=1;
  let r_message="";
  let r_data=[];
  let q =await models.sequelize.query(`SELECT * FROM user_document_detail where user_id = ${userid}`,{type:QueryTypes.SELECT})
  JSON.parse(JSON.stringify(q))
 for (let [key,row] of Object.entries(q)){
   if(!isNaN(row.updated_by)&& row.updated_by>0){
    let userInfo=await getUserInfo(row.updated_by,models);
    q[key].updated_by={
      user_id:row.updated_by,
      name:userInfo.name,
      role:userInfo.role_name
    };
   }
   let link="";
   if(typeof row.link_1!=="undefined" && row.link_1!==""){
     link =row.link_1;
     link=link.replace("'></iframe>","")
     link=link.trim();
   }
   q[key]["doc_link"]=link;
 }
 r_error=0;
 r_data.user_document_info=q;
 let Return={};
 Return.error=r_error;
 Return.data=r_data;
 return Return;
}

let getUserPolicyDocument=async(userid,req,models)=>{
  try{
  let r_error=1;
  let r_message = "";
  let r_data    = [];
  let Return={};
  let q1=await models.sequelize.query(`SELECT * FROM user_profile where user_Id = ${userid}`,{type:QueryTypes.SELECT})
  if(q1.length==0){
    Return.error=0;
    Return.message=`there is no user_profile having user_Id =${userid}`;
    return Return;
  }
  let ar0=JSON.parse(q1[0].policy_document)
  let q2=await models.sequelize.query(`SELECT * FROM config where type ='policy_document'`,{type:QueryTypes.SELECT})
  if(q2.length==0){
    Return.error=0;
    Return.message="there is no config file having type:policy Document"
    return Return;
  }
  let ar1=JSON.parse(q2[0].value)
  let arr=[];
  if (ar0==null){
    for(let v2 of Object.entries(ar1)){
      v2.read=0;
      let mandatory = 1;
      if(typeof (v2.mandatory)!=="undefined"){
        mandatory = v2.mandatory;
    }
      v2.mandatory=mandatory;
      arr.push(v2)

  }
}  
 if (ar0!==null){
  for(let v3 of Object.entries(ar1)){
    if(ar0.includes(v3.name)){
       v3.read=1;
       arr.push(v3);
    }else{
       v3.read=0;
       arr.push(v3)
    }
}
}
r_error=0;
r_data=arr;
Return.error=r_error;
Return.data=r_data;
// console.log(Return)
return Return;
  }catch(error){
    console.log(error)
    throw new Error(error)
  }

}
let getEmployeeLifeCycle=async(userid,models)=>{
  try{
  let Return={};
  let employee_life_cycle=await getELC(userid,models);
  // console.log(employee_life_cycle,"++++++++++++++++++++++++++")
  let employeeLifeCycleStepsDone = await getEmployeeLifeCycleStepsDone( userid,models);
  if(employeeLifeCycleStepsDone.length>0){
    let data_employee_life_cycle = employee_life_cycle.employee_life_cycle;
  }
  Return.error= 0;
  Return.message= '';
  Return.data={
    employee_life_cycle:employee_life_cycle
  }
  return Return;
}catch(error){
  console.log(error)
} 

};
let getEmployeeLifeCycleStepsDone=async(userid,models)=>{
let q= await models.sequelize.query(`select * from employee_life_cycle where userid=${userid}`,{type:QueryTypes.SELECT})
if(q.length>0){
  return q;
}
return [];
}

let getELC=async(userid=false,models)=>{
  let allList = await getGenericElcList(models);
  employeeLifeCycleStepsDone = [];
  if(userid!=false){
    employeeLifeCycleStepsDone = await getEmployeeLifeCycleStepsDone(userid,models );
  }
  for(let[key,g] of Object.entries(allList)){
   let g_step_id = g.id;
   let status=0;
   for(let d of Object.entries(employeeLifeCycleStepsDone)){
    let d_elc_step_id = d.elc_step_id;
    if(g_step_id == d_elc_step_id){
      status=1;
    }
   }
   allList[key].status =status;
  }
 let Return={};
//  console.log(allList)
 for( let elc of allList){
  //  console.log(elc,"---===---==---==-")
  let sort = 0;
  if( typeof elc.sort!==undefined){
      sort = elc.sort;
  }
  if(elc.stage_id in Return ){
      Return[elc].stage_id.steps[
        id = elc.id,
        text =elc.text,
        sort = sort
      ]
      Return[elc].stage_id.steps.status=elc.status;
  }else{
    Return.elc = elc;
      Return.elc.stage_id ={
          stage_id:elc.stage_id,
          text :await getElcStageName(elc.stage_id,models),
      }
      Return.elc.stage_id.steps = [];
      Return.elc.stage_id.steps=[
        id = elc.id,
        text= elc.text,
        status = elc.status,
        sort = sort
      ]
  }
}
if(Return.length > 0 ){
  for( let [key, stage] of Object.entries(Return)){
      if( typeof stage.steps!="undefined" && stage.steps.length>0 ){
          let  steps = stage.steps;
          usort( $steps, array( 'HR', 'sortElcStageSteps' ) );
          Return.key.steps = steps;
      }
  }
}
console.log(Return,"----------------------------------")
return Return;
}
let getElcStageName=async(stageid,models)=>{
  let allStages=await getElcStages(models);
  for(let[key,stage] of Object.entries(allStages)){
    allStages[key].name= stage.text;
  }
  let stageName = '';
  for(let stage of Object.entries(allStages)){
    if( stage.id == stageid ){
      stageName = stage.name;
      break;
  }
  }
 return stageName;
}
let getGenericElcList=async(models)=>{
  // console.log(34241341)
  let rawElcData = await getRawElcData(models);
  // console.log(rawElcData)
  let allStages=[];
  let elc=[];
     for ([key,row] of Object.entries(rawElcData.steps)) {
           elc =[ 
                stage_id= row.elc_stage_id,
                id = row.id,
                text = row.name
           ]
            allStages.push(elc);
        }
        return allStages;
}
let getRawElcData=async(models)=>{
  let elc_stages=await getElcStages(models);
  // console.log(elc_stages,"++++++++++++++++")
  let elc_steps=await models.sequelize.query(`SELECT * FROM elc_stages JOIN elc_stages_steps on elc_stages.id = elc_stages_steps.elc_stage_id`,{type:QueryTypes.SELECT})
  let ret={
    stages:elc_stages,
    steps:elc_steps
  }
return ret;
}
let getElcStages=async(models)=>{
  let q=await models.sequelize.query(`SELECT * FROM elc_stages`,{type:QueryTypes.SELECT})
  return q;
}

let  updateELC=async(elc_stepid,userid,models)=>{
  let error = 0;
  let message = "";
  if(Array.isArray(elc_stepid)){
    if(elc_stepid.length == 0 ){
    error = 1;
    message = "No stepid is passed!";
    }else{
      for(let [key,stepid] of Object.entries(elc_stepid)){
       let q =await models.sequelize.query( `select * from employee_life_cycle where userid=${userid} AND elc_step_id=${stepid}`,{type:QueryTypes.SELECT})
       if(q.length>0){
       let  q2 = await models.sequelize.query(`DELETE FROM employee_life_cycle where userid=${userid} AND elc_step_id=${stepid}`,{type:QueryTypes.DELETE}); 
       }else{
        let q3 =await models.sequelize.query (`INSERT into employee_life_cycle ( userid, elc_step_id  ) VALUES ( ${userid}, ${stepid} )`,{type:QueryTypes.INSERT});
       }
      }
      error=0;
      message="Sucessfully Updated!!";
    }
}else{
  error = 1;
  message = "stepid should be an array!";
}
let Return={};
Return.error = error;
Return.message = message;
Return.data = [];
return Return;
}
let getTeamList= async(req,models)=>{
  let r_error = 1;
  let r_message = "";
  let r_data = {};
  let q1 =await models.sequelize.query (`select * from config where type ='team_list'`,{type:QueryTypes.SELECT})
  JSON.parse(JSON.stringify(q1))
  if(q1.length==0){
    r_error = 1;
    r_message = "Team list not found";
  }else{
    r_error = 0;
    r_message = "Team list are";
    r_data = q1;
  }
  let Return = {};
  Return.message=r_message
  Return.error = r_error;
  Return.data= r_data;
  return Return;

}
let UpdateUserInfo =async(req,models)=>{
  let r_error = 0;
  let r_message = "";
  req.body['updated_on'] = date("Y-m-d");
  let r_data =[];
  let userid = req.body['user_id'];
  let user_profile_detail =await getUserprofileDetail(uuserid,req,models);
  let whereField = 'user_Id';
  let whereFieldVal = userid;
  let emailAlert_termination = false;
  let do_updateConfirmationEmail = false;
  if(typeof req.body['sendConfirmationEmail']!=undefinded && req.body['sendConfirmationEmail'] == true ){
    do_updateConfirmationEmail = true;
}
let dates_keys = [
  'termination_date',
  'training_completion_date',
  'dateofjoining',
  'dob'
]
let msg = [];
let res1 = [];
for (let [key,val] of Object.entries(user_profile_detail)) {
  if (key in req.body) {
      if (req.body.key != user_profile_detail[key] || ( key == "training_completion_date" && do_updateConfirmationEmail == true ) ) {
          /* check new other_email new email id already exist*/
          let other_email_exists = false;
          if( key == "other_email" ){
              let qCheck = (`SELECT * FROM user_profile WHERE user_Id != ${userid} AND other_email='${data.key}'`,{type:QueryTypes.SELECT})
              if( qCheck.length > 0 ){
                  other_email_exists = true;
              }
          }
          if( other_email_exists ){
              r_error = 1;
              r_message = "Personal email id already exists!!";
              break;
          }                    
          /* check new other_email new email id already exist*/

          /* check new work_email new email id already exist*/
           work_email_exists = false;
          if( key == "work_email" ){
              qCheck = (`SELECT * FROM user_profile WHERE user_Id != ${userid} AND work_email='${data.key}";`,{type:QueryTypes.SELECT})
              if(  qCheck.length > 0 ){
                  work_email_exists = true;
              }
          }
          if( work_email_exists ){
              r_error = 1;
              r_message = "Work email id already exists!!";
              break;
          }                    
          /* check new work_email new email id already exist*/
          
          let arr = [];
          arr[key] = req.body[key];
          updateCheck = await DBupdateBySingleWhere('user_profile', $whereField, $whereFieldVal, $arr);
          if( updateCheck ){
              if( key == "termination_date" ){
                  emailAlert_termination = true;
              }
              res.push(updateCheck);
          }
          msg[key] = req.body[key];
      }

      if(key in dates_keys&& req.body.key ){
          let q = (`UPDATE user_profile SET ${key}= NULL WHERE user_Id = ${userid}`,{type:QueryTypes.SELECT})
          res.push(q) ;;                 
      }
  }
}
if( r_error == 1){
  r_data['message'] = r_message;
}else{
  if (res.length == 0) {
    r_error = 0;
    r_message = "No fields updated into table";
    r_data['message'] = r_message;
}else{
  let userInfo = await getUserInfo(userid,models);
  let userInfo_name = userInfo['name'];
  let slack_userChannelid =userInfo['slack_profile']['id'];
  if (req.body['send_slack_msg'] == "") {

    if (msg.length > 0) {
       let detailsUpdated = "";
        for (let [key,valu] of Object.entries(msg)) {
            if (key != "holding_comments" && key != "termination_date") {
                detailsUpdated[key] = valu;
            }
        }

        let messageBody = [   
        ]
        messageBody.details=detailsUpdated;
        // slackMessageStatus = await sendNotification( "employee_profile_update", $userid, $messageBody);
    }
}



if( emailAlert_termination ){
  if(req.body['notifyEmpTermination']!=undefined && req.body['notifyEmpTermination'] == true ){
      let to = [];
      to.push(userInfo['work_email'])
      if(typeof userInfo['other_email']!=undefined && userInfo['other_email']){
          to.push(userInfo['other_email'])
      }
      let emailData =[]
      emailData['sendEmail'] = [
      ]
      emailData['sendEmail']["to"]=to;
      emailData['templatekey'] = "Employee Termination";
      emailData['templateSubject'] = "";
      emailData['templateData'] = await getEmployeeCompleteInformation(userid);
      await sendTemplateEmail(emailData);
  }
  if(typeof req.body['notifyEmpTerminationPolicies']!=undefined && req.body['notifyEmpTerminationPolicies'] == true ){
     let to = []
      to.push(userInfo['work_email'])
      if(typeof userInfo['other_email']!=undefined && userInfo['other_email']){
          to.push(userInfo['other_email'])
      }
      let emailData = []
      emailData['sendEmail'] = [
      ]
      emailData['sendEmail'][to]=to;
      emailData['templatekey'] = "Employee Termination Policies";
      emailData['templateSubject'] = "";
      emailData['templateData'] = await getEmployeeCompleteInformation(userid);
      await sendTemplateEmail(emailData);
  }
}
  /* send confirmation email */
  if(typeof req.body['sendConfirmationEmail']!=undefined && req.body['sendConfirmationEmail'] == true ){
    if( typeof req.body['notifyEmpConfirmation']!=undefined && req.body['notifyEmpConfirmation'] == true ){
        let to = [];
        to.push(userInfo['work_email'])
        let emailData =[]
        emailData['sendEmail'] =[
        ]
        emailData['sendEmail'][to]=to;
        emailData['templatekey'] = "Employee Confirmation";
        emailData['templateSubject'] = "";
        emailData['templateData'] = await getEmployeeCompleteInformation(userid);
        // await sendTemplateEmail(emailData);
    }
    if(typeof req.body['notifyEmpConfirmationPolicies'] && req.body['notifyEmpConfirmationPolicies'] == true ){
        let to = array();
        to.push(userInfo['work_email'])
        let emailData =[]
        emailData['sendEmail'] =[
        ]
        emailData['sendEmail'][to]=to;
        emailData['templatekey'] = "Employee Confirmation Policies";
        emailData['templateSubject'] = "";
        emailData['templateData'] = await getEmployeeCompleteInformation(userid);
        // await sendTemplateEmail(emailData);
    }
}
/* send email */
  r_error = 0;
  r_message = "Employee details updated successfully!!";
  r_data['message'] = r_message;
}
}
let Return = {}
Return.error = r_error;
Return.data = r_data;
return Return;

}
let saveTeamList=async(req,models)=>{
  try{
  let r_error = 0;
  let r_message = "";
  let r_data ={};
  let newTeamsArray = req.body.value;
  let existingTeamList = await getTeamList(req,models);
  let existingTeams=existingTeamList.data;
  let teamToDelete = false;
  let teamToDeleteEmployees ={};
  if(existingTeams.length > 0 ){
    for(let [key,value] of Object.entries(existingTeams)) {
      if( newTeamsArray.includes(value) ){
          teamToDelete = value;
          break;
      }
  }
  }
  if( teamToDelete != false ){
   teamToDeleteEmployees = await getAllUserDetail(teamToDelete,models)
}
if( teamToDelete != false && (teamToDeleteEmployees.length) > 0 ){
  r_error = 1;
  r_message = "Team can not be delete as employees are assigned to this team.";
  r_data.message=r_message;
}else{
  let ins={};
  ins.type=req.body.type;
  ins.value=req.body.value;
  let q1=await models.sequelize.query(`select * from config where type ='${req.body.type}'`,{type:QueryTypes.SELECT})
if(q1.length==0){
  r_error = 0;
  await models.sequelize.query(`Insert into config (type,value)values('${req.body.type}','${req.body.value}')`,{type:QueryTypes.INSERT})
  r_message = "Successfully Inserted";
  r_data.message = r_message;
}else{
  let value =req.body.value;
  let q = await models.sequelize.query(`UPDATE config set value='${value}' WHERE type ='${req.body.type}' `,{type:QueryTypes.UPDATE});
    r_error = 0;
    r_message = "Updated successfully";
    r_data.message= r_message;
}
}
let Return ={};
Return.error = r_error;
Return.data= r_data;
console.log(Return)
return Return;
}catch(error){
  console.log(error)
}
}
let getAllUserDetail=async(data=false,req,models)=>{
//   let q;
//   if (data === "") {
//     q = await models.sequelize.query(`SELECT users.*,user_profile.* FROM users LEFT JOIN user_profile ON users.id = user_profile."user_Id" where users.status = 'Enabled'`,{type:QueryTypes.SELECT})
// }
// if (data !=="") {
//     q = await models.sequelize.query(`SELECT users.*,user_profile.* FROM users LEFT JOIN user_profile ON users.id = user_profile."user_Id" where users.status = 'Enabled' AND user_profile.team = ${data}`,{type:QueryTypes.SELECT})
// }
// let row2={};
// for(let val of q){
//   if(val.username){
//   let userid = val.user_Id;
//   val.user_bank_detail=await getUserBankDetail(userid,req,models)
//   val.user_assign_machine=await getUserAssignMachines(userid,req,models);

//   }
// }
}
let UpdateUserBankInfo=async(req,models)=>{
  try{
  let r_error = 1;
  let r_message = "";
  let r_data = {};
  let userid;
  if(req.body.user_id){
    userid= req.body.user_id;
  }else{
    userid=req.userData.id;
  }
  let userInfo = await getUserInfo(userid,models);
  let userInfo_name = userInfo[0].name;
  let f_bank_name = req.body.bank_name;
  let f_bank_address = req.body.bank_address;
  let f_bank_account_no = req.body.bank_account_no;
  let f_ifsc =req.body.ifsc;
  let q =await models.sequelize.query(`SELECT * from user_bank_details WHERE user_Id=${userid}`,{type:QueryTypes.SELECT})    
  console.log(q,"++++++++++++++++++++++++++++++++++++++++++++++++++++") 
   if(q.length==0){
     await models.sequelize.query(`INSERT INTO user_bank_details ( "user_Id", bank_name, bank_address, bank_account_no, ifsc ) VALUES ( ${userid}, '${f_bank_name}', '${f_bank_address}', '${f_bank_account_no}', '${f_ifsc}' )`,{type:QueryTypes.INSERT})
   }
   else{
     q=await models.sequelize.query(`UPDATE user_bank_details set bank_name='${f_bank_name}', bank_address='${f_bank_address}', bank_account_no='${f_bank_account_no}', ifsc='${f_ifsc}' WHERE user_Id=${userid}`,{type:QueryTypes.UPDATE})
   }
   r_error=0;
   r_message="Data Successfully Updated";
   r_data['message'] = r_message;
   let detailsUpdated ={};
  detailsUpdated["Bankname"] =f_bank_name;
  detailsUpdated["Bank address"] =f_bank_address;
  detailsUpdated["Bank Account No"] =f_bank_account_no;
  detailsUpdated["Bank IFSC Code"] = f_ifsc ;
  Return = {};
  Return['error'] = r_error;
  Return['data'] = r_data;
  return Return;

  }catch(error){
    console.log(error)
  }
}
let getSalaryInfo= async(userid,models,sort=false,date=false)=>{
 let q=await models.sequelize.query(`select * from salary where "user_Id" = ${userid}`,{type:QueryTypes.SELECT})
  if (sort == 'first_to_last') {
    q = (`select * from salary where "user_Id" = ${userid} ORDER by id ASC`,{type:QueryTypes.SELECT});
       }
  let applicable_month = 0;
  for(let[key,r] of Object.entries(q)){
    if(typeof r.applicable_from !==undefinded && r.applicable_from !=="" && r.applicable_from !=="0000-00-00"){
      applicable_from = r['applicable_from'];
    }
    if(typeof r.applicable_from !==undefinded && r.applicable_till != "" && r.applicable_till!=="0000-00-00"){
    applicable_till = r.applicable_till;
    }
   if( typeof applicable_from !==undefined && typeof applicable_till){         
    begin = new DateTime( applicable_from );
    end = new DateTime( applicable_till );
    interval =createFromDateString('1 month');
    period = new DatePeriod($begin, $interval, $end);                                
    applicable_month = iterator_count($period);
} 
q[key]['applicable_month']=applicable_month;
applicable_month=0;
  }
  if(date!=false){
    let arr=[];
    for(let val of Object.entries(row) ){
      arr.push(val)
    }
    return arr;
  }else{
    return q;
  }
}
let updatePassword=async(req,userData,db)=>{
  try{
  let r_error = 1;
  let r_message = "";
  let r_data ={}

  let f_userid = "";
  let f_newPassword = "";
  let loggedUserInfo=userData;
  if(typeof loggedUserInfo.id !=undefined){
    f_userid = loggedUserInfo['id'];
    if (req.body.password){
      f_newPassword = req.body.password.trim();
    }
    if (f_newPassword == '') {
        r_message = "Password is empty!!";
        }else if (f_newPassword.length< 4) {
        r_message = "Password must be atleast 4 characters!!";
        }else {
        await updateUserPassword(f_userid, f_newPassword,db);
        r_error = 0;
        r_message = "Password updated Successfully!!";

        let messageBody ={}
       // $slackMessageStatus = self::sendNotification( "password_update", $f_userid, $messageBody);
      }
  } else {
  let r_error= 1;
  r_data['message'] = "User not found";
}
        let Return = {};
        Return.error = r_error;
        r_data.message = r_message;
        Return.data = r_data;
        return Return;
}catch(error){
  console.log(error)
}
}
let updateUserPassword=async(f_userid, f_newPassword,models)=>{
  try {
    console.log(f_userid)
    let newPassword=md5(f_newPassword);
    let q=await models.sequelize.query(`UPDATE users set password='${newPassword}' WHERE users.id='${f_userid}'`,{type:QueryTypes.UPDATE})
    console.log(q)

  } catch (error) {
    console.log(error)
  }
}
  module.exports={
    getUserDetailInfo,
    getUserBankDetail,
    getUserprofileDetail,
    getUserAssignMachines,
    getEnabledEmployeesBriefDetails,
    getEnabledUsersListWithoutPass,
    getEnabledUsersList,
    getDisabledUser,
    getUserDocumentDetail,
    getUserPolicyDocument,
    getEmployeeLifeCycle,
    updateELC,
    getTeamList,
    saveTeamList,
    getAllUserDetail,
    UpdateUserBankInfo,
    getSalaryInfo,UpdateUserInfo,updatePassword

  }