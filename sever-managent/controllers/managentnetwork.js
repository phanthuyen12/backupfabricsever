const path = require("path");
const fs = require("fs");
const { Gateway, Wallets } = require("fabric-network");
const bcrypt = require('bcrypt');
const { connectToNetworkorgvalue ,connectToNetworkorg,connectToNetworkmedicalvalue} = require('../controllers/network');
const jwt = require('jsonwebtoken');

const { UpdateStatusHospitalBranchByIds } = require('./hospitalbrach');
const { getAccessToken, makeCall } = require('./SendCall');
require('dotenv').config();

// Lấy giá trị từ biến môi trường
const NameNetworkValue = process.env.NAMENETWORK || "channel1";

// Kết nối đến mạng
async function connectToNetwork() {
  const ccpPath = path.resolve(
    __dirname,
    "..",
    "..",
    "network",
    "organizations",
    "peerOrganizations",
    "org1.example.com",
    "connection-org1.json"
  );
  const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

  const walletPath = path.join(process.cwd(), "wallet");
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: "userorg1",
    discovery: { enabled: true, asLocalhost: true },
  });

  const network = await gateway.getNetwork(NameNetworkValue);
  const contract = network.getContract("NetworkManagent");

  return { contract, gateway };
}

// Hàm thêm yêu cầu thay đổi admin
const crypto = require('crypto');

exports.addAdminChangeRequests = async (req, res) => {
  const { tokeorg, currentAdminToken, newAdminToken, reason ,nameOrg,namenewAdminToken,namecurrentAdminToken} = req.body;
  // Kết nối với Hyperledger Fabric network
  const { contract, gateway } = await connectToNetwork();

  try {
    const data = Date.now(); // Sử dụng thời gian làm ID yêu cầu
    console.log('tokeorg', tokeorg);
    console.log('currentAdminToken', currentAdminToken);
    console.log('newAdminToken', newAdminToken);
    console.log('reason', reason);
    console.log('data', data);
    const requestId = crypto.randomBytes(16).toString('hex') + Date.now();

    // Gọi chaincode để thêm yêu cầu thay đổi admin
    const response = await contract.submitTransaction('AddAdminChangeRequest', tokeorg, currentAdminToken, newAdminToken, reason, data, requestId,nameOrg,namenewAdminToken,namecurrentAdminToken);
    console.log('Chaincode response:', response.toString());

    if (!response || response.length === 0) {
      console.error("No response from chaincode.");
      return res.status(500).json({
        data: "false",
        status: false,
        message: "Không nhận được phản hồi từ chaincode."
      });
    }
    
    let result;
    try {
      result = JSON.parse(response.toString());
    } catch (error) {
      console.error("Error parsing response:", error);
      return res.status(500).json({
        data: "false",
        status: false,
        message: "Dữ liệu trả về từ chaincode không hợp lệ."
      });
    }

    // Kiểm tra phản hồi từ chaincode và trả về kết quả
    if (result && result.message === "Change admin request created successfully.") {
      return res.json({
        data: "true",
        status: true
      });  // Yêu cầu thay đổi admin thành công
    } else {
      return res.json({
        data: "false",
        status: false
      });  // Yêu cầu thay đổi admin không thành công
    }
  } catch (error) {
    console.error("Lỗi khi gửi yêu cầu thay đổi admin:", error);
    return res.status(500).json({
      data: "false",
      status: false,
      message: "Có lỗi xảy ra khi gửi yêu cầu thay đổi admin."
    });
  } finally {
    // Đóng kết nối sau khi thao tác xong
    if (gateway) {
      await gateway.disconnect();
    }
  }
};

exports.getAllChangeHistory =async (req,res)=>{
  const { contract, gateway } = await connectToNetwork();
  try {
    // Gọi chaincode để cập nhật trạng thái yêu cầu
    const response = await contract.evaluateTransaction('getAllAdminChangeHistories');

    const result = JSON.parse(response.toString());

    return res.json(result); // Trả về kết quả từ chaincode
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái yêu cầu thay đổi admin:", error);
    return res.status(500).json({
      status: false,
      message: "Có lỗi xảy ra khi cập nhật trạng thái yêu cầu."
    });
  } finally {
    // Đóng kết nối sau khi thao tác xong
    await gateway.disconnect();
  }
}
// Hàm cập nhật trạng thái yêu cầu thay đổi admin
exports.updateAdminChangeStatus = async (req, res) => {
  const { tokenorg, id } = req.body;

  const { contract, gateway } = await connectToNetwork();

  try {
    // Gọi chaincode để cập nhật trạng thái yêu cầu
    const status = "COMPLETED";
    const response = await contract.submitTransaction('updateAdminChangeStatus', tokenorg, id, status);

    if (!response) {
      throw new Error('No response from chaincode');
    }

    const result = JSON.parse(response.toString());
    return res.status(200).json({
      status: true,
    });  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái yêu cầu thay đổi admin:", error);
    return res.status(500).json({
      status: false,
      message: "Có lỗi xảy ra khi cập nhật trạng thái yêu cầu."
    });
  } finally {
    // Đóng kết nối sau khi thao tác xong
    await gateway.disconnect();
  }
};

// Hàm lấy toàn bộ yêu cầu thay đổi admin của tổ chức
exports.getAdminChangeHistory = async (req, res) => {
  const { tokeorg } = req.body;
  console.log(req.body);
  const { contract, gateway } = await connectToNetwork();

  try {
    // Gọi chaincode để lấy toàn bộ yêu cầu thay đổi admin
    const response = await contract.submitTransaction('getAdminChangeHistory', tokeorg);

    const result = JSON.parse(response.toString());

    return res.json(result); // Trả về kết quả từ chaincode
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử yêu cầu thay đổi admin:", error);
    return res.status(500).json({
      status: false,
      message: "Có lỗi xảy ra khi lấy lịch sử yêu cầu."
    });
  } finally {
    // Đóng kết nối sau khi thao tác xong
    await gateway.disconnect();
  }
}
