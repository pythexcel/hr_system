function RolesPage(database, type) {
  const rolesPage = database.define("roles_pages", {
    role_id: type.INTEGER,
    page_id: type.INTEGER,
    is_enabled: type.BOOLEAN,
  });
  rolesPage.associate = (models) => {
    rolesPage.hasOne(models.Role, {
      foreignKey: "role_id",
      as: "role",
    });
  };
  return rolesPage;
}

module.exports = RolesPage;