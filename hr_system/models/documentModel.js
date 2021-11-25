function Document(database, type) {
  const document = database.define(
    "documents",
    {
      title: type.STRING,
      filepath: type.STRING,
      uploaded_on: type.DATE,
    },
    {
      timestamps: false,
      freezeTableName: true,
    }
  );

  document.uploadUserDocument = async (req) => {
    try {
      // console.log(req);
      const data = {
        filepath: req.file.path,
        title: req.file.name,
        uploaded_on: Date.now(),
      };
      // console.log(data);
      // await document.create(data);
      // return "uploaded"
    } catch (error) {
      throw new Error(error);
    }
  };

  return document;
}
module.exports = Document;
