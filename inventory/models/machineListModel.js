function machinelist(database, type) {
	const MachineList = database.define(
		'machinelist',
		{
			machine_type: type.STRING,
			machine_name: type.STRING,
			machine_price: type.STRING,
			serial_number: type.STRING,
			date_of_purchase: type.DATE,
			mac_address: type.STRING,
			operating_system: type.STRING,
			status: type.STRING,
			comments: type.STRING,
			warranty_end_date: type.DATE,
			bill_number: type.STRING,
			warranty_comment: type.STRING,
			repair_comment: type.STRING,
			file_inventory_invoice: type.INTEGER,
			file_inventory_warranty: type.INTEGER,
			file_inventory_photo: type.INTEGER,
			warranty_years: type.STRING,
			approval_status: type.INTEGER,
			is_unassign_request: type.INTEGER,
			ownership_change_req_by_user: type.INTEGER,
		},
		{
			timestamps: true,
			freezeTableName: true
		},
	);
	MachineList.associate = (models) => {
		models.MachineList.hasOne(models.FilesModel, { foreignKey: 'file_inventory_invoice',as:"file_inventory_invoice_id"});
		models.MachineList.hasOne(models.FilesModel, { foreignKey: 'file_inventory_warranty',as:"file_inventory_warranty_id"});
		models.MachineList.hasOne(models.FilesModel, { foreignKey: 'file_inventory_photo',as:"file_inventory_photo_id"});
	}

	MachineList.createMachine = async (reqBody) => {
		try {
			let creation = await MachineList.create({
				machine_type: reqBody.machine_type,
				machine_name: reqBody.machine_name,
				machine_price: reqBody.machine_price,
				serial_number: reqBody.serial_number,
				date_of_purchase: reqBody.date_of_purchase,
				mac_address: reqBody.mac_address,
				operating_system: reqBody.operating_system,
				status: reqBody.status,
				comments: reqBody.comments,
				warranty_end_date: reqBody.warranty_end_date,
				bill_number: reqBody.bill_number,
				warranty_comment: reqBody.warranty_comment,
				repair_comment: reqBody.repair_comment,
				file_inventory_invoice: reqBody.file_inventory_invoice,
				file_inventory_warranty: reqBody.file_inventory_warranty,
				file_inventory_photo: reqBody.file_inventory_photo,
				warranty_years: reqBody.warranty_years,
				approval_status: reqBody.approval_status,
				is_unassign_request: reqBody.is_unassign_request,
				ownership_change_req_by_user: reqBody.ownership_change_req_by_user,
			});
			return creation.id;
		} catch (error) {
			throw new Error(error);
		}
	};

	MachineList.getAll = async (limit, offset) => {
		try {
			let all_machine = await MachineList.findAll({ limit, offset });
			return all_machine;
		} catch (error) {
			throw new Error('Unable to locate all users');
		}
	};

	return MachineList;
}

module.exports = machinelist;
