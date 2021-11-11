const {
  PAGE_login,
  PAGE_logout,
  PAGE_my_inventory,
  PAGE_policy_documents,
  getAllPages,
  getAllActions,
} = require("./roles");

const jwt = require("jsonwebtoken");
const secret = require("./config.json");

const {Op,QueryTypes, json } = require("sequelize");
const db = require("./db");
const { sequelize } = require("./db");


let getPageById = async (id) => {
  let data;
  let all = await getAllPages();
  for (let item in all) {
    if (all[item].id == id) {
      data = all[item];
    }
  }
  return data;
};


let getRolePages = async (roleid, models) => {
  let query = await models.RolesPage.findAll({
    where: { role_id: roleid },
  });
  if (query.length > 0) {
    let data = await Promise.all(
      query.map(async (doc) => {
        doc = JSON.parse(JSON.stringify(doc));
        let obj = { ...doc };
        let page = await getPageById(doc.page_id);
        obj.page_name = page.name;
        return obj;
      })
    );
    return data;
  }
};


let getRoleActions = async (roleid, models) => {
  let query = await models.RolesAction.findAll({
    where: { role_id: roleid },
  });
  if (query.length > 0) {
    let getActionById = async (id) => {
      let data;
      let all = await getAllActions();
      for (let item in all) {
        if (all[item].id == id) {
          data = all[item];
        }
      }
      return data;
    };
    let data = await Promise.all(
      query.map(async (doc) => {
        doc = JSON.parse(JSON.stringify(doc));
        let obj = { ...doc };
        let action = await getActionById(doc.action_id);
        obj.action_name = action.name;
        return obj;
      })
    );
    return data;
  }
};


// let getRoleNotifications = async (roleid, models) => {
//   let query =
//     await models.RolesNotification.findAll({
//       where: { role_id: roleid },
//     });
//   if (query.length > 0) {
//     let getNotificationById = async (id) => {
//       let data;
//       let all = await getAllNotifications();
//       for (let item in all) {
//         if (all[item].id == id) {
//           // return item;
//           data = all[item];
//         }
//       }
//       return data;
//     };
//     let data = await Promise.all(
//       query.map(async (doc) => {
//         doc = JSON.parse(JSON.stringify(doc));
//         let obj = { ...doc };
//         let notification =
//           await getNotificationById(
//             doc.notification_id
//           );
//         obj.notification_name = notification.name;
//         return obj;
//       })
//     );
//     return data;
//   }
// };


let getRolePagesForSuperAdmin = async () => {
  let data = await getGenericPagesForAllRoles();
  let allPages = await getAllPages();
  allPages.forEach((page) => {
    newPage = { page_id: page.id, page_name: page.name };
    data.push(newPage);
  });
  let sorted_Data = data.sort();
  return sorted_Data;
};


let getGenericPagesForAllRoles = async () => {
  let data = [];
  let allPages = await getAllPages();
  for (let page in allPages) {
    let pid = allPages[page].id;
    if (
      pid == PAGE_login ||
      pid == PAGE_logout ||
      pid == PAGE_policy_documents ||
      pid == PAGE_my_inventory
    ) {
      let newPage = {
        page_id: allPages[page].id,
        page_name: allPages[page].name,
      };
      data.push(newPage);
    }
  }
  return data;
};


// let _getEmployeeProfilePhoto = async (profileInfo) => {
//   let profileImage;
//   if (
//     profileInfo.slack_profile.profile.image_original != null
//   ) {
//     profileImage = profileInfo.slack_profile.image_original;
//   } else {
//     let uploadedImage;
//     if (profileInfo.image != null) {
//       uploadedImage = profileInfo.image;
//     }
//     if (uploadedImage != null) {
//       if (uploadedImage.indexOf("avatar.slack") !== false) {
//         profileImage = uploadedImage;
//       } else {
//         profileImage = `${process.env.BASEURL}backend/attendance/uploads/profileImages/${profileInfo["image"]}`;
//       }
//     }
//   }
//   return profileImage;
// };


let getUserInfo = async (userId, models) => {
  let users = await models.User.findOne({ where: { id: userId } });
  let user_profile = await models.UserProfile.findOne({
    where: { user_Id: users.id },
  });
  let user_roles = await models.UserRole.findOne({
    where: { user_id: users.id },
  });
  // console.log(user_roles)
  let roles = await models.Role.findOne({
    where: { id: user_roles.role_id },
  });
  let data = [];
  data.users = users;
  data.user_profile = user_profile;
  data.user_roles = user_roles;
  data.roles = roles;
  return data;
};


let getUserInfoByWorkEmail = async (workEmailId, models) => {
  let userProfile = await models.UserProfile.findOne({
    where: { work_email: workEmailId },
  });
  let user = await models.User.findOne({ where: { id: userProfile.user_Id } });
  let user_roles = await models.UserRole.findOne({
    where: { user_id: user.id },
  });
  let roles = await models.Role.findOne({
    where: { id: user_roles.role_id },
  });
  //  let userSlackInfo = getSlackUserInfo(workEmailId);
  let data = [];
  data.userProfile = userProfile;
  data.user = user;
  data.user_roles;
  data.roles = roles;
  //  data.slack_profile = userSlackInfo;
  return data;
};


let getRoleCompleteDetails = async (roleId, models) => {
  let data;
  let query = await models.Role.findAll({
    where: { id: roleId },
  });
  // query = JSON.parse(JSON.stringify(query));
  if (query.length > 0) {
    let role = [];
    role.role = query[0];
    let pages = await getRolePages(roleId, models);
    let actions = await getRoleActions(roleId, models);
    // let notification = await getRoleNotifications(
    //   roleId, models
    // );
    role.role_pages = pages;
    role.role_actions = actions;
    // role.role_notifications = notification;
    data = role;
  }
  return data;
};


let getUserRole = async (userId, models) => {
  let data;
  let userInfo = await getUserInfo(userId, models);
  if (userInfo.user_roles.role_id != null) {
    let roleCompleteDetails = await getRoleCompleteDetails(
      userInfo.user_roles.role_id,
      models
    );
    data = roleCompleteDetails;
  }
  return data;
};


let getRolePagesForApiToken = async (roleid, models) => {
  let data = await getGenericPagesForAllRoles();
  let rolesPages = await getRolePages(roleid, models);
  if (rolesPages != null) {
    rolesPages.forEach((rp) => {
      data.push(rp);
    });
  }
  let sorted_Data = data.sort();
  return sorted_Data;
};



let checkifPageEnabled = async (page_id, models) => {
  let query = await models.RolesPage.findAll({
    where: {
      [Op.and]: [{ page_id: page_id }, { is_enabled: true }],
    },
  });
  if (query.length > 0) {
    return true;
  } else {
    return false;
  }
};


let getInventoriesRequestedForUnassign = async (models) => {
  let query = await models.MachineList.findAll(
    { attributes: [["id", "machine_id"]] },
    { where: { is_unassign_request: 1 } }
  );
  return query;
};


let getInventoriesRequestedForOwnershipChange = async (models) => {
  let query = await models.MachineList.findAll(
    { attributes: [["id", "machine_id"]] },
    { where: { ownership_change_req_by_user: 1 } }
  );
  return query;
};


let getUserInventories = async (userid, models, userRole = false) => {
  let data = false;
  let query = await models.MachineUser.findAll({ where: { user_Id: userid } });
  let roleName;
  if (userRole == false) {
    let roleDetails = await getUserRole(userid, models);
    if (roleDetails.role.name) {
      roleName = roleDetails.role.name;
    }
  } else {
    roleName = userRole;
  }
  if (
    roleName.toLowerCase() == "hr" ||
    roleName.toLowerCase() == "inventory manager"
  ) {
    let unassignRequestInventories = await getInventoriesRequestedForUnassign(
      models
    );
    query = query.concat(unassignRequestInventories);
    if (query.length > 1) {
      let tempExists = [];
      for (let i = 0; i < query.length; i++) {
        if (tempExists.includes(query[i].machine_id)) {
          query.pop();
        }
        tempExists.push(query[i].machine_id);
      }
    }
  }
  if (
    roleName.toLowerCase() == "hr" ||
    roleName.toLowerCase() == "inventory manager"
  ) {
    let ownershipChangeRequestInventories =
      await getInventoriesRequestedForOwnershipChange(models);
    query = query.concat(ownershipChangeRequestInventories);
    if (query.length > 1) {
      let tempExists = [];
      query.forEach((key) => {
        if (tempExists.includes(key.machine_id)) {
          query.pop();
        }
        tempExists.push(key.machine_id);
      });
    }
  }
  if (query.length == 0) {
  } else {
    data = query;
  }
  return data;
};


let getRolesForPage = async (page_id, models) => {
  let roles = [];
  let query = await models.RolesPage.findAll({ where: { page_id: page_id } });
  for (let ele in query) {
    let role = await getRoleCompleteDetails(query[ele].role_id, models);
    roles.push(role.role.name.toLowerCase());
  }
  return roles;
};

// ---------------------------remains--------------------------------
let getInventoryComments = async (inventory_id, models) => {
  let row = {};
  let q1 = await models.InventoryCommentsModel.findAll({
    where: { inventory_id: inventory_id },
  });
  for (let i in q1) {
    let q2 = await models.UserProfile.findAll({
      where: { user_Id: q1[i].updated_by_user_id },
    });
    let q3 = await models.UserProfile.findAll({
      where: { user_Id: q1[i].assign_unassign_user_id },
    });
    row.update_by_user = q2;
    row.assign_unassign_user_name = q3;
  }
  row.inventory_comments = q1;
  return row;
};


let getInventoryHistory = async (inventory_id, models) => {
  let inventoryComments = await getInventoryComments(inventory_id, models);
  return inventoryComments;
};


let _getDateTimeData = async () => {
  let data = {};
  let currentTimeStamp = Math.floor(new Date().getTime() / 1000);
  data.current_timestamp = currentTimeStamp;
  data.current_date_number = new Date().getDate();
  data.current_month_number = new Date().getMonth() + 1;
  data.current_year_number = new Date().getFullYear();
  let date = new Date();
  data.todayDate_Y_m_d =
    date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
  return data;
};


let getInvenoryAuditFullDetails = async (audit_id, models) => {
  let Return = {};
  let data = {};
  let q1 = await models.InventoryAuditMonthWise.findOne(
    { attributes: ["id", "inventory_id", "month", "year", "updated_at"] },
    { where: { id: audit_id } }
  );
  let q2 = await models.UserProfile.findOne(
    {
      attributes: [
        ["name", "audit_done_by_user_name"],
        ["work_email", "audit_done_by_user_email"],
      ],
    },
    { where: { user_Id: audit_done_by_user_id } }
  );
  let q3 = await models.InventoryCommentsModel.findOne(
    { attributes: [["comment", "audit_comment"], "comment_type"] },
    { where: { inventory_comment_id: q1.inventory_comment_id } }
  );
  data.inventory_audit_month_wise = q1;
  data.audit_done_by = q2;
  data.inventory_comments = q3;
  if (Object.keys(data).length == 0) {
  } else {
    Return = data;
  }
  return Return;
};


let getInventoryAuditStatusforYearMonth = async (
  inventory_id,
  year,
  month,
  models
) => {
  let data = false;
  let q = await models.InventoryAuditMonthWise.findAll({
    where: {
      [Op.and]: [
        { inventory_id: inventory_id },
        { year: year },
        { month: month },
      ],
    },
  });
  if (q.length == 0) {
  } else {
    let row = q[0];
    data = await getInvenoryAuditFullDetails(row.id, models);
  }
  return data;
};


let getInventoryFullDetails = async (
  id,
  hide_assigned_user_info = false,
  models
) => {
  let row = {};
  let query1 = await models.MachineList.findOne({ where: { id: id } });
  console.log(query1)
  let query2 = await models.MachineUser.findOne(
    { attributes: ["user_Id", "assign_date"] },
    { where: { machine_id: query1.id } }
  );
  let query3 = await models.UserProfile.findOne(
    { attributes: ["name", "work_email"] },
    { where: { user_id: query2.dataValues.user_Id } }
  );
  let query4 = await models.FilesModel.findOne({
    where: { id: query1.file_inventory_invoice },
  });
  let query5 = await models.FilesModel.findOne({
    where: { id: query1.file_inventory_warranty },
  });
  let query6 = await models.FilesModel.findOne({
    where: { id: query1.file_inventory_photo },
  });
  row.machine_list = query1;
  row.machine_user = query2;
  row.user_profile = query3;
  row.file_inventory_invoice = query4;
  row.file_inventory_warranty = query5;
  row.file_inventory_photo = query6;
  let r_error = 0;
  let inventoryHistory = await getInventoryHistory(id, models);
  row.history = inventoryHistory;
  let assignedUserInfo = {};
  if (hide_assigned_user_info == false) {
    if (row.machine_user.user_Id != null) {
      let raw_assignedUserInfo = await getUserInfo(
        row.machine_user.user_Id,
        models
      );
      assignedUserInfo.name = raw_assignedUserInfo.name;
      assignedUserInfo.jobtitle = raw_assignedUserInfo.jobtitle;
      assignedUserInfo.work_email = raw_assignedUserInfo.work_email;
      // userProfileImage = await _getEmployeeProfilePhoto(raw_assignedUserInfo);
      // assignedUserInfo.profileImage = userProfileImage;
    }
  }
  row.assigned_user_info = assignedUserInfo;
  if (
    typeof row.machine_list.ownership_change_req_by_user != "undefined" &&
    row.machine_list.ownership_change_req_by_user * 1 > 0
  ) {
    let ownershipRequestedByUser = await getUserInfo(
      row.machine_list.ownership_change_req_by_user
    );
    if (typeof ownershipRequestedByUser.name !== "undefined") {
      row.ownership_change_req_by_user = ownershipRequestedByUser.name;
    }
  }
  let currentMonthAuditStatus = [];
  let dateTimeData = await _getDateTimeData();
  currentMonthAuditStatus.year = dateTimeData.current_year_number;
  currentMonthAuditStatus.month = dateTimeData.current_month_number;
  currentMonthAuditStatus.status = await getInventoryAuditStatusforYearMonth(
    id,
    dateTimeData.current_year_number,
    dateTimeData.current_month_number,
    models
  );
  row.audit_current_month_status = currentMonthAuditStatus;
  if (
    typeof row.file_inventory_invoice != "undefined" &&
    row.file_inventory_invoice != null
  ) {
    row.file_inventory_invoice = `${process.env.ENV_BASE_URL}.'attendance/uploads/inventories/'.${row.file_inventory_invoice}`;
  }
  if (
    typeof row.file_inventory_warranty != "undefined" &&
    row.file_inventory_warranty != null
  ) {
    row.file_inventory_warranty = `${process.env.ENV_BASE_URL}.'attendance/uploads/inventories/'.${row.file_inventory_warranty}`;
  }
  if (
    typeof row.file_inventory_photo != "undefined" &&
    row.file_inventory_photo != null
  ) {
    row.file_inventory_photo = `${process.env.ENV_BASE_URL}.'attendance/uploads/inventories/'.${row.file_inventory_photo}`;
  }
  return row;
};

// -------------------------------remanis--------------------------------

let isInventoryAuditPending = async (userid, models) => {
  let isAuditPending = false;
  let userInventories = await getUserInventories(userid, models);
  if (userInventories == false) {
  } else {
    let hide_assigned_user_info = true;
    for (let ele in userInventories) {
      let i_details = await getInventoryFullDetails(
        userInventories[ele].dataValues.machine_id,
        hide_assigned_user_info,
        models
      );
      if (i_details.audit_current_month_status.status == null) {
        isAuditPending = true;
      }
    }
    return isAuditPending;
  }
};


let getUserPolicyDocument = async (userid, models) => {
  let r_error = 1;
  let r_message;
  let r_data = [];
  let q1 = await models.UserProfile.findOne({ where: { user_Id: userid } });
  let ar0 = JSON.parse(q1.policy_document);
  let q2 = await models.Config.findOne({ where: { type: "policy_document" } });
  let ar1 = JSON.parse(q2.value);
  let arr = [];
  if (ar0.length == 0) {
    for (let v2 in ar1) {
      ar1[v2].read = 0;
      let mandatory = 1;
      if (typeof ar1[v2].mandatory !== "undefined") {
        mandatory = ar1[v2].mandatory;
      }
      ar1[v2].mandatory = mandatory;
      arr.push(ar1[v2]);
    }
  }
  if (ar0.length != 0) {
    for (let v3 in ar1) {
      if (ar0.includes(ar1[v3].name)) {
        ar1[v3].read = 1;
        arr.push(ar1.v3);
      } else {
        ar1[v3].read = 1;
        arr.push(ar1[v3]);
      }
    }
  }
  r_error = 0;
  r_data = arr;
  let data = [];
  data.error = r_error;
  data.data = r_data;
  return data;
};


let is_policy_documents_read_by_user = async (userid, models) => {
  let data = true;
  let allDocumentsResult = await getUserPolicyDocument(userid, models);
  let allDocuments = allDocumentsResult.data;
  if (Array.isArray(allDocuments)) {
    for (let doc in allDocuments) {
      if (allDocuments[doc].read != 1 && allDocuments[doc].mandatory == 1) {
        data = false;
      }
    }
  }
  return data;
};


let isUnassignInventoriesRequestPending = async (models) => {
  let unassignRequestInventories = await getInventoriesRequestedForUnassign(
    models
  );
  if (unassignRequestInventories.length > 0) {
    return true;
  }
  return false;
};


let isOwnershipChangeInventoriesRequestPending = async (models) => {
  let ownershipChangeRequestInventories =
    await getInventoriesRequestedForOwnershipChange(models);
  if (ownershipChangeRequestInventories.length > 0) {
    return true;
  }
  return false;
};


let generateUserToken = async (userId, models) => {
  let userInfo = await getUserInfo(userId, models);
  if (userInfo == null) {
  } else {
    // let userProfileImage = await _getEmployeeProfilePhoto(userInfo);
    let userRole;
    if (userInfo.users.type.toLowerCase() == "admin") {
      userRole = userInfo.users.type;
    } else {
      let roleInfo = await getUserRole(userInfo.user_profile.user_Id, models);
      if (roleInfo != null) {
        userRole = roleInfo.role.name;
      }
    }
    u = {
      id: userInfo.user_profile.user_Id,
      username: userInfo.users.username,
      role: userRole,
      name: userInfo.user_profile.name,
      jobtitle: userInfo.user_profile.jobtitle,
      // profileImage : userProfileImage,
      login_time: new Date().getTime(),
      login_date_time: new Date(),
      // eth_token : userInfo.users.eth_token,
    };
    let roleAction = [];
    if (userInfo.users.type.toLowerCase() == "admin") {
      u.role_pages = await getRolePagesForSuperAdmin();
    } else {
      let roleInfo = await getUserRole(userInfo.user_profile.user_Id, models);
      if (roleInfo != null) {
        let role_pages = await getRolePagesForApiToken(
          roleInfo.role.id,
          models
        );
        for (let page in role_pages) {
          if (!checkifPageEnabled(role_pages[page].page_id, models)) {
            role_pages.page.pop();
          }
        }
        u.role_pages = role_pages;
      }
      if (roleInfo != null) {
        let role_actions = roleInfo.role_actions;
        role_actions.forEach((key) => {
          roleAction.push(key.action_name);
        });
      }
    }
    u.role_actions = roleAction;
    u.is_policy_documents_read_by_user = 1;
    u.is_inventory_audit_pending = 0;
    if (userInfo.users.type.toLowerCase() == "admin") {
      if (isInventoryAuditPending(userInfo.users.id, models)) {
        let generic_pages = await getGenericPagesForAllRoles();
        u.right_to_skip_inventory_audit = 1;
        u.is_inventory_audit_pending = 1;
        generic_pages.forEach((ele) => {
          if (!checkifPageEnabled(ele.page_id, models)) {
            key.pop();
          }
        });
        u.role_pages = generic_pages;
      }
      // let isValidGoogleDriveTokenExistsStatus = await isValidGoogleDriveTokenExists();
      // u.is_valid_google_drive_token_exists = isValidGoogleDriveTokenExistsStatus;
    } else {
      let generic_pages = await getGenericPagesForAllRoles();
      let is_policy_documents_read_by_user2 =
        await is_policy_documents_read_by_user(
          userInfo.user_profile.user_Id,
          models
        );
      if (is_policy_documents_read_by_user2 == false) {
        u.is_policy_documents_read_by_user = 0;
        generic_pages.forEach((ele) => {
          if (!checkifPageEnabled(ele.page_id, models)) {
            key.pop();
          }
        });
        u.role_pages = generic_pages;
      }
      let hasUnassignRequestInventories = false;
      let hasOwnershipChangeInventoriesRequestPending = false;
      if (userInfo.users.type.toLowerCase() == ("hr" || "inventory manager")) {
        hasUnassignRequestInventories =
          await isUnassignInventoriesRequestPending(models);
        hasOwnershipChangeInventoriesRequestPending =
          await isOwnershipChangeInventoriesRequestPending(models);
      }
      if (
        isInventoryAuditPending(userInfo.users.id, models) ||
        hasUnassignRequestInventories ||
        hasOwnershipChangeInventoriesRequestPending
      ) {
        u.is_inventory_audit_pending = 1;
        generic_pages.forEach((ele) => {
          if (!checkifPageEnabled(ele.page_id, models)) {
            key.pop();
          }
        });
        if (
          // addOns.skip_inventory_audit &&
          userInfo.users.type.toLowerCase() ==
          ("hr" || "inventory manager" || "hr payroll manager")
        ) {
        } else {
          u.role_pages = generic_pages;
        }
      }
      if (
        userInfo.users.type.toLowerCase() ==
        ("hr" || "inventory manager" || "hr payroll manager")
      ) {
        if (u.is_inventory_audit_pending == 1) {
          // if (addOns.skip_inventory_audit) {
          //   u.is_inventory_audit_pending = 0;
          // } else {
          u.right_to_skip_inventory_audit = 1;
          // }
        }
      }
    }
    for (let ele in u.role_pages) {
      let roles = await getRolesForPage(u.role_pages[ele].page_id, models);
      u.role_pages[ele].roles = roles;
    }
  }
  let token = jwt.sign({ data: u }, secret.jwtSecret, {
    expiresIn: "2hr",
  });
  return token;
};


const refreshToken = async (oldToken, models, addOns = false) => {
  let Return = oldToken;
  let ReturnedData = await isValidTokenAgainstTime(oldToken);
  if (ReturnedData) {
    oldToken = oldToken.split(" ");
    const checkJwt = await jwt.verify(oldToken[1], secret.jwtSecret);
    let loggedUserInfo = jwt.decode(oldToken[1]);
    let loggedUserInfo_userid = loggedUserInfo.data.id;
    Return = await generateUserToken(loggedUserInfo_userid, models, addOns);
  }
  return Return;
};

const isValidTokenAgainstTime = async (token) => {
  let Return = true;
  token = token.split(" ");
  const checkJwt = await jwt.verify(token[1], secret.jwtSecret);
  let tokenInfo = jwt.decode(token[1]);
  if (typeof tokenInfo != undefined && tokenInfo.data.login_time != "") {
    let token_start_time = tokenInfo.data.login_time;
    let current_time = new Date().getTime();
    let time_diff = current_time - token_start_time;
    let mins = time_diff / 60000;
    if (mins > 60) {
      Return = false;
    }
  } else {
    Return = false;
  }
};

let getMachineDetail = async (id, models,) => {
  try {
    let error = 0;
    let row = {};
    console.log(id)
    let query1 = await models.MachineList.findOne({ where: { id: id } });

    let query2 = await models.MachineUser.findOne(
      { attributes: ["user_Id", "assign_date"] },
      { where: { machine_id: query1.id } }
    );
    let query3 = await models.FilesModel.findOne({
      where: { id: query1.file_inventory_invoice },
    });
    let query4 = await models.FilesModel.findOne({
      where: { id: query1.file_inventory_warranty },
    });
    let query5 = await models.FilesModel.findOne({
      where: { id: query1.file_inventory_photo },
    });
    row.machine_list = query1;
    row.machine_user = query2;
    row.file_inventory_invoice = query3;
    row.file_inventory_warranty = query4;
    row.file_inventory_photo = query5;
    // let all_machine = await MachineList.findOne({
    //   where: { id: req.body.id },
    //   include: [
    //     {
    //       model: db.FilesModel,
    //       as: "file_inventory_invoice_id",
    //     },
    //     {
    //       model: db.FilesModel,
    //       as: "file_inventory_warranty_id",
    //     },
    //     {
    //       model: db.FilesModel,
    //       as: "file_inventory_photo_id",
    //     },
    //   ],
    // });
    // res.send(all_machine);

    // let userProfiledata = await db.UserProfile.findAll({
    //   where: { id: inventory_comments.assign_unassign_user_id },
    // });
    // return all_machine;
    const inventoryHistory = await getInventoryHistory(id, models);
    row.history = inventoryHistory;
    let Return = {};
    Return.error = error;
    Return.data = row;
    return Return;
  } catch (error) {
    console.log(error);
    throw new Error("Unable to locate all users");
  }
};

const api_addInventoryAudit = async (
  loggedUserInfo,
  inventory_id,
  logged_user_id,
  audit_comment_type,
  audit_message,
  models,req
) => {
  const addInventoryAudit1=  await addInventoryAudit(loggedUserInfo,inventory_id,logged_user_id,audit_comment_type,audit_message,models,req);
  let messageBody = [];
  if (audit_comment_type == "issue" || audit_comment_type == "critical_issue") {
    let inventoryDetails = await getMachineDetail(inventory_id, models);
    messageBody.issueType =
      audit_comment_type == "issue" ? "Issue" : "Critical Issue";
    messageBody.inventoryName = inventoryDetails.data.machine_name;
    messageBody.inventoryType = inventoryDetails.data.machine_type;
    messageBody.message = audit_message;
  }
  if (
    typeof loggedUserInfo != "undefined" &&
    typeof loggedUserInfo.role != undefined
  ){
   let loggedUserRole =loggedUserInfo.role.toLowerCase();
   if(loggedUserRole=='admin'||loggedUserRole == 'hr'||loggedUserRole=='inventory manager'){
     if(typeof inventoryDetails!=undefined){
      inventoryDetails=await getMachineDetail(inventory_id,models)
     }
     if(typeof inventoryDetails.data!="undefined" &&typeof inventoryDetails.data.user_Id!="undefined"){
      let assignedUsedId = inventoryDetails.data.user_id;
      if(assignedUsedId!=null){
      audit_comment_type = audit_comment_type.replace("_"," ")
      audit_comment_type = audit_comment_type.toLowerCase().replace(/\b[a-z]/g, function(letter) {
      return letter.toUpperCase();
      });
      messageBody.issueType = audit_comment_type ;
      messageBody.inventoryName=inventoryDetails.data.machine_name;
      messageBody.inventoryType=inventoryDetails.data.machine_type;
      messageBody.message  = audit_message;
   }
  }
}
  }
  Return = [];
  Return.error = 0;
  Return.message = 'Audit added for inventory successfully!!';
  Return.data = [];
  return Return;

};

const addInventoryAudit= async(loggedUserInfo,inventory_id,updated_by_user_id,audit_comment_type,audit_comment,models,req)=>{
  inventory_id = typeof inventory_id!="undefined" ? inventory_id : "";
  audit_done_by_user_id = updated_by_user_id ? updated_by_user_id : "";
  audit_comment_type    = audit_comment_type ? audit_comment_type : "";
  audit_message         = audit_comment ? audit_comment : "";
  let dateTimeData = await _getDateTimeData();
  let audit_month  = dateTimeData.current_month_number;
  let audit_year   = dateTimeData.current_year_number;

  let inventory_comment_id  = await addInventoryComment(inventory_id,loggedUserInfo.id,models,req)
  console.log(123)
  let q= await models.InventoryAuditMonthWise.create(inventory_id, audit_month, audit_year, audit_done_by_user_id, inventory_comment_id )
  return true;
}

let getMachineStatusList=async(req,models)=>{
  let r_error=1;
  let r_message="";
  let r_data=[];
  let q1 =await models.sequelize.query(`SELECT machine_status.*, (SELECT COUNT(*) FROM machinelist WHERE machinelist.status = machine_status.status) AS total_inventories FROM machine_status`, {type:QueryTypes.SELECT })
  console.log(q1.length)
  if(q1.length==0){
    r_message="no machine status list found";
  }else{
    r_error = 0;
    r_data  = q1;
  }
  let Return =[];
  Return.error=r_error;
  Return.data=r_data;
  Return.message=r_message;
  return Return;

}

let getMachineCount=async(req,models)=>{
  let r_error=1;
  let r_message = "";
  let query=await models.sequelize.query( 'SELECT machinelist.*, machines_user."user_Id" FROM machinelist LEFT JOIN machines_user ON machinelist.id= machines_user."machine_id"',{type:QueryTypes.SELECT })
  let arr_device={};
  if(query.length>0){
    count=1;  
  for(let elem of query){
    let key=elem.machine_type.trim();
    let key2 = elem.status.toLowerCase().replace(/\b[a-z]/g, function(letter) {
      return letter.toUpperCase(); });
      if(arr_device.hasOwnProperty(key)){
         arr_device[key].total++;
         if(arr_device[key].hasOwnProperty(key2)){
           arr_device[key][key2]++;
         }else{
           arr_device[key][key2]=1;
         }
         if(elem.user_Id!=""||elem.user_Id!=null){
          arr_device[key]["User_Assign"]++;
         }else{
           arr_device[key]["User_Not_Assign"]++;
         }
      }else{
        arr_device[key] ={'total':1}
        if(arr_device[key].hasOwnProperty(key2)){
          arr_device[key][key2]=+1;
        }else{
          arr_device[key][key2] =  1;
        }
        if(elem.user_Id!=""||elem.user_Id!=null){
          arr_device[key]["User_Assign"]= 1;
        }else{
          arr_device[key]["User_Not_Assign"]=+1;
        }
      }
  }
  }
  let a =Object.keys(arr_device).length;
  if(Object.keys(arr_device).length){
    r_error=0;
    r_message = "Data found";
  }else{
    r_error = 1;
    r_message = "No Data found";
  }
  Return = [];
  Return.error = r_error;
  Return.data= arr_device;
  Return.message = r_message;
  return Return;
}

let addInventoryComment = async (machine_id, loggeduserid,models,req) => {
  const inventoryComment = await models.InventoryCommentsModel.create({
    inventory_id: machine_id,
    updated_by_user_id: loggeduserid,
    comment_type: req.body.comment_type,
    comment: req.body.unassign_comment,
  });
  if (req.body.assign_unassign_user_id != null) {
    const inventoryComment = await models.InventoryCommentsModel.create({
      inventory_id: machine_id,
      updated_by_user_id: loggeduserid,
      comment_type: req.body.comment_type,
      comment: req.body.unassign_comment,
      assign_unassign_user_id: req.body.assign_unassign_user_id,
    });
  }
  return inventoryComment.id;
};

let addMachineType=async(req,models)=>{
  let r_error=1;
  let not_deleted="";
  let r_message="";
  let r_data=[];
  let ins={}
  ins.type=req.body.type;
  ins.value=req.body.value;
  let q=await models.sequelize.query(`select * from config where type ='${req.body.type}'`,{type:QueryTypes.SELECT})
  if(q.length==0){
    await models.Config.create(ins)
    let r_error=0;
    let r_message = "Variable Successfully Inserted";
    r_data.message= r_message;
  }
  let arr1=[]
  if(q.length!=0){
    for(i=0;i<q.length;i++){
      arr1.push(q[i].value)
    }
    let arr2=req.body;
    arr2=Object.values(arr2);
    let s = arr1
    .filter(x => !arr2.includes(x))
    .concat(arr2.filter(x => !arr1.includes(x)));
    if(s.length>0){
        for(let v of s){
        let query=await models.sequelize.query(`select * from machinelist where machine_type ='${v}'`,{type:QueryTypes.SELECT})
         if(query.length>0){
          r_data['not_delete']=v;
          arr2.push(v)
         }
      }
    }
    let res=JSON.stringify(req.body.dataValues);
   await models.Config.update({value:res},{
     where:{type:req.body.type}
   })
   let r_error=0;
   let r_message = "Variable updated successfully";
   r_data.message = r_message;
}
   let Return=[];
   Return.error=r_error;
   Return.data= r_data;
   return Return;
}

const AddMachineStatus =async(req,models)=>{
  let addInventoryStatusType1 = await addInventoryStatusType(req,models)
}
const getAllMachinesDetail =async(req,models,sort=null,status_sort=null)=>{
  try{
  if(sort!==null){
    let q=await models.sequelize.query(`select machinelist.*, machines_user."user_Id", machines_user.assign_date, user_profile.name, user_profile.work_email, f1.file_name as fileInventoryInvoice, f2.file_name as fileInventoryWarranty, f3.file_name as fileInventoryPhoto from machinelist left join machines_user on machinelist.id = machines_user.machine_id left join user_profile on machines_user."user_Id" = user_profile."user_Id" left join files as f1 ON machinelist.file_inventory_invoice = f1.id left join files as f2 ON machinelist.file_inventory_warranty = f2.id left join files as f3 ON machinelist.file_inventory_photo = f3.id where machinelist.machine_type='${sort}' and machinelist.approval_status = 1`,{type:QueryTypes.SELECT})
  }
  if(status_sort!==null){
     let q=await models.sequelize.query(`select machinelist.*, machines_user."user_Id",machines_user.assign_date,user_profile.name,user_profile.work_email,f1.file_name as fileInventoryInvoice,f2.file_name as fileInventoryWarranty,f3.file_name as fileInventoryPhoto from machinelist left join machines_user on machinelist.id = machines_user.machine_id left join user_profile on machines_user."user_Id" = user_profile."user_Id" left join files as f1 ON machinelist.file_inventory_invoice = f1.id left join files as f2 ON machinelist.file_inventory_warranty = f2.id left join files as f3 ON machinelist.file_inventory_photo = f3.id where machinelist.status='${status_sort}' and machinelist.approval_status = 1`,{type:QueryTypes.SELECT})
    }else{
      q=await models.sequelize.query(`select machinelist.*, machines_user."user_Id",machines_user.assign_date,user_profile.name,user_profile.work_email,f1.file_name as fileInventoryInvoice,f2.file_name as fileInventoryWarranty,f3.file_name as fileInventoryPhoto from machinelist left join machines_user on machinelist.id = machines_user.machine_id left join user_profile on machines_user."user_Id" = user_profile."user_Id" left join files as f1 ON machinelist.file_inventory_invoice = f1.id left join files as f2 ON machinelist.file_inventory_warranty = f2.id left join files as f3 ON machinelist.file_inventory_photo = f3.id where machinelist.approval_status = 1 ORDER BY machinelist.id DESC`,{type:QueryTypes.SELECT})
    }
    for(let [key,row]of Object.entries(q)){
     let inventoryHistory= await getInventoryHistory(row.id,models);
     q[key]["history"]=inventoryHistory;
     if(typeof row['fileInventoryInvoice']!="undefined"&& row['fileInventoryInvoice']!="")
     {
      q[key]["file_inventory_invoice"] = `${process.env.ENV_BASE_URL}.'attendance/uploads/inventories/'.${row.file_inventory_invoice}`;
     }
     if (
      typeof row["file_inventory_photo"] != "undefined" &&
      row["file_inventory_photo"] != null
    ) {
      q[key]["file_inventory_photo"] = `${process.env.ENV_BASE_URL}.'attendance/uploads/inventories/'.${row.file_inventory_photo}`;
    }
    if (
      typeof row[key]["file_inventory_warranty"] != "undefined" &&
      row[key]["file_inventory_warranty"] != null
    ) {
      q[key]["file_inventory_warranty"] = `${process.env.ENV_BASE_URL}.'attendance/uploads/inventories/'.${row.file_inventory_warranty}`;
    }
    }
    let Return=[];
    Return.error=0;
    Return.data=q;
    return Return;

  }catch(error){
console.log(error)
  }
}
const addInventoryStatusType = async(req,models)=>{
let r_error = 0;
let r_message = "";
let r_data    = [];
let newStatus = false;
if(typeof req.body.status==undefined || req.body.status==null||req.body.status==""){
r_error = 1;
r_message = "Status is empty.";
}
else{
 let data_status = req.body.status.trim();
 console.log(data_status)
 let q =await models.sequelize.query(`SELECT * FROM machine_status WHERE status = :status`, { replacements: { status: data_status }, type:QueryTypes.SELECT })
if(q.length>0){
  r_error   = 1;
  r_message = "data_status status already exists";
} else {
  let is_default=0;
  let color='';
  q=await models.MachineStatus.create(data_status,is_default,color)
  if (q!=null) {
      r_error   = 1;
      r_message = "Error in adding status."
  } else {
      r_error   = 0;
      r_message = "$data_status status added successfully.";
  }
}
}
let Return =[];
Return['error']   = r_error;
Return['message'] = r_message;
Return['data']    = r_data;
console.log(Return)
return Return;
}
//working on it 
const UpdateOfficeMachine=async(req,models)=>{
let r_error=1;
let r_message="";
let logged_user_id=req.userData
console.log(req.userData)
console.log(logged_user_id)
data =[];
  data.machine_type=req.body.machine_type,
  data.machine_name =req.body.machine_name,
  data.machine_price =req.body.machine_price,
  data.serial_number =req.body.serial_no,
  data.mac_address =req.body.mac_address,
  data.date_of_purchase =req.body.purchase_date,
  data.operating_system =req.body.operating_system,
  data.status =req.body.status,
  data.comments =req.body.comment,
  data.warranty_end_date =req.body.warranty,
  data.bill_number =req.body.bill_no,
  data.warranty_comment =req.body.warranty_comment,
  data.repair_comment =req.body.repair_comment,
  data.warranty_years =req.body.warranty_years,

console.log(data)
let inventory_id=req.body.id;
let machine_detail=await getMachineDetail(inventory_id,models);
let priorCheckError = false;
let newStatus=req.body.status;
let oldStatus=machine_detail['data']['status'];
if(newStatus.toLowerCase()=='sold'&&newStatus!=oldStatus){
  if(typeof machine_detail['data']['user_Id']!=="undefined"&&machine_detail['data']['user_Id']!=null){
    r_error=1;
    r_message="You need to unassign this inventory before setting its status to Sold";
    priorCheckError = true;
  }
}
if(priorCheckError==false){
  addInventoryComment(inventory_id,logged_user_id,models,req)
  let whereField = 'id';
  let whereFieldVal = inventory_id ;
  for(let [key,value] of Object.entries(machine_detail['data'])){
    if(data.includes(key)){}
  }
}
}

module.exports = {
  getRolePagesForSuperAdmin,
  getGenericPagesForAllRoles,
  getRolePages,
  getRolesForPage,
  getRoleActions,
  //   getRoleNotifications,
  //   _getEmployeeProfilePhoto
  getUserInventories,
  getUserInfo,
  getUserInfoByWorkEmail,
  getUserRole,
  getRolePagesForApiToken,
  checkifPageEnabled,
  getInventoryHistory,
  getInventoryFullDetails,
  isInventoryAuditPending,
  isUnassignInventoriesRequestPending,
  is_policy_documents_read_by_user,
  isOwnershipChangeInventoriesRequestPending,
  generateUserToken,
  refreshToken,
  isValidTokenAgainstTime,
  api_addInventoryAudit,
  addInventoryAudit,
  addInventoryComment ,
  getMachineDetail,
  AddMachineStatus,
  addMachineType,
  addInventoryStatusType,
  getMachineStatusList,
  getMachineCount,
  getAllMachinesDetail,
  UpdateOfficeMachine
};
