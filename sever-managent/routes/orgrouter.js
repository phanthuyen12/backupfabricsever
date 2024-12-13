const express = require('express');
const router = express.Router();
require('dotenv').config(); // Đọc file .env và nạp biến môi trường trước tiên

const orgController = require('../controllers/orgController');
const meidacaController = require('../controllers/medicaConroller');
const hospitalbrachController = require('../controllers/hospitalbrach');

const interfaceController = require('../controllers/interfaceController');
const runOrgController = require('../../network/controller/runOrg');
const userController = require('../controllers/userController');
const networkApiController = require('../controllers/networkApiController');
const networkController = require('../controllers/usenetwork');
const managentnetwork = require('../controllers/managentnetwork');
const outputdataControler = require('../controllers/outputdataControler');
const NameNetwork = process.env.NAMENETWORK;

router.post('/creater-org', orgController.createOrg);
router.post('/change-admin', orgController.changeAdminToDoctors);
router.post('/org/superadmin', orgController.getSuperadminOrg);
router.post('/users/create', userController.createUser);

router.post('/users/login', userController.loginUser);
router.post('/out/count-org', outputdataControler.CountHospital);
router.post('/out/count-user', outputdataControler.CountUser);
router.post('/out/count-medical', outputdataControler.CountMedical);
router.post('/hospital/uptatestatus', orgController.updateOrganizationStatus)
router.post('/hospital/upsyncstatus', orgController.updateOrganizationSyncstatus);



router.post('/getinfo-org', orgController.getorginformation);
router.post('/getall-org', orgController.getAllOrganizations);

router.post('/create-user', orgController.Createuser);
router.post('/login-org', orgController.loginorganization);
router.post('/update-user', orgController.updateUser);
router.post('/getinfo-user', orgController.getinfoUser);
router.post('/creater-org-folders', runOrgController.checkroleadmin);
router.post('/checkrole', orgController.checkroleadmin);
router.get('/show-all-org', orgController.getAllOrganizationsToken);
router.get('/false/show-all-org', orgController.getAllOrganizationsTokenFalse);
router.get('/true/show-all-org', orgController.getAllOrganizationsTokenTrue);
// router.get('/show-all-org-token', orgController.getAllOrganizationsToken);
router.post('/create-brach', hospitalbrachController.create_brach);
router.post('/getfull-brach', hospitalbrachController.getFull_brach);
router.post('/getfull-personnel', hospitalbrachController.getFull_personnel);
router.post('/getpersonnel-bytoken', hospitalbrachController.getpersonnelBytoken);
router.post('/get-request-branch', hospitalbrachController.getHospitalBranchByIds);


router.post('/network-stop', networkController.closeNetwork);
router.post('/network-up', networkController.openNetwork);
router.post('/update-network', networkController.updateNetwork);
router.post('/deloychaincode', networkController.deployChaincode);


router.post('/request-record',meidacaController.requestbookaccess);
router.post('/approveaccess-record',meidacaController.approveAccess);
router.post('/hasaccess-record',meidacaController.hasAccess);
router.post('/medicalHistorys-record',meidacaController.getMedicalHistorys);

router.post('/create-record', meidacaController.createrecord);
router.post('/getinfo-record', meidacaController.getDataRecord);
router.post('/getfull-record', meidacaController.getfullRecords);
router.post('/getfull-accessRequests', meidacaController.getMedicalHistorys);
router.post('/get-examination-information', meidacaController.getDataInHospital);
router.post('/register-record', meidacaController.registerMedical);
router.post('/login-record', meidacaController.loginmedical);
router.post('/update-record', meidacaController.updateRecords);
router.post('/approve-access-request', meidacaController.approveAccessRequest);
router.post('/medical/checkinfo', meidacaController.checkInfoMedical);
router.post('/medical/pushdata', meidacaController.PushDataInHospital);
router.post('/medical/diseasecode', meidacaController.getAllDiseaseCode);
router.post('/medical/diseasecodedetail', meidacaController.getByDiseaseCodeDetail);
router.post('/medical/diseasecode/org', meidacaController.getFieldsToShares);
router.post('/medical/forgot-password', meidacaController.forgotPassword);
router.post('/medical/verify-password', meidacaController.verifyAndChangePassword);
router.post('/medical/diseasecode-byhospital', meidacaController.getDiseaseDetailsByCodes);

-
router.get('/networkapi/get', networkApiController.getAllNetworks);
router.post('/networkapi/update', networkApiController.updateNetwork);

// managentnetwork
router.post('/managentnetwork/changeadmin', managentnetwork.addAdminChangeRequests);
router.post('/managentnetwork/changeadmin/byorg', managentnetwork.getAdminChangeHistory);
router.get('/managentnetwork/changeadmin', managentnetwork.getAllChangeHistory);
router.post('/managentnetwork/update', managentnetwork.updateAdminChangeStatus);

// Route để đăng nhập
router.post('/login', userController.loginUser);
// router.get('/interface-options',interfaceController.index);
// router.get('/list-options',interfaceController.index);forgotPassword



router.get('/index', (req, res) => {
    res.json({ message: 'Xin chào các bạn!' });
});

module.exports = router;