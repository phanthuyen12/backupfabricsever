const path = require("path");
const fs = require("fs");
const { Gateway, Wallets } = require("fabric-network");
const bcrypt = require('bcrypt');
const { connectToNetworkorgvalue ,connectToNetworkorg,connectToNetworkmedicalvalue} = require('../controllers/network');
const jwt = require('jsonwebtoken');
const { UpdateStatusHospitalBranchByIds } = require('./hospitalbrach');
const crypto = require('crypto'); // Đảm bảo đã import thư viện crypto
const { getAccessToken,makeCall}  = require('./SendCall');
// Sử dụng hàm ở đây
require('dotenv').config(); // Đọc file .env để nạp biến môi trường

// Lấy giá trị từ biến môi trường
const NameNetworkValue = process.env.NAMENETWORK || "channel1";  
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
  const contract = network.getContract("medical");

  return { contract, gateway };
}
exports.checkInfoMedical = async (req, res) => {
  const { cccd, email } = req.body;
  console.log(req.body);

  if (!cccd) {
      return res.status(400).send('Invalid input');
  }

  let gateway; // Declare gateway here so it is available in the finally block

  try {
      const { contract, gateway: connectedGateway } = await connectToNetwork();
      gateway = connectedGateway; // Assign the connected gateway to the outer gateway variable

      const result = await contract.evaluateTransaction('checkRecordInfo', email, cccd);

      if (result) {
          const medical = JSON.parse(result.toString());
          res.status(200).send(medical);
      } else {
          console.error('Result is undefined');
          res.status(500).send('Unexpected result from transaction');
      }
  } catch (error) {
      console.error(`Failed to evaluate transaction: ${error.message}`);
      res.status(500).send(`Failed to get data record: ${error.message}`);
  } finally {
      if (gateway) { // Ensure gateway is defined before disconnecting
          await gateway.disconnect();
      }
  }
};

exports.updateRecords = async (req, res) => {
  const { cccd, weight, height, medicalinsurance, birthDate, gender, address, phoneNumber, avatar } = req.body;
  // console.log('Request body:', req.body);
  // console.log('Request cccd:', cccd);
  // console.log('Request weight:', weight);
  // console.log('Request height:', height);
  // console.log('Request medicalinsurance:', medicalinsurance);
  // console.log('Request birthDate:', birthDate);
  // console.log('Request gender:', gender);
  // console.log('Request gender:', gender);
  // console.log('Request phoneNumber:', phoneNumber);
  // console.log('Request avatar:', avatar);
  
  // Kiểm tra tính hợp lệ của các trường đầu vào
  if (!cccd || !weight || !height || !medicalinsurance || 
    !birthDate || !gender || !address || !phoneNumber || !avatar) {
  return res.status(400).json({ success: false, message: 'Invalid input: missing required fields' });
}

  try {
    // Kết nối với mạng
    const { contract, gateway } = await connectToNetwork();
    const currentTime = new Date();

    // Gửi giao dịch
    const result = await contract.submitTransaction(
      'updateRecord', 
      cccd, 
      weight, 
      height, 
      medicalinsurance, 
      birthDate, 
      gender, 
      address, 
      phoneNumber, 
      avatar, 
      currentTime.toISOString()
    );
    // console.log('Transaction result:', result.toString());

    if (result) {
      // Trả về phản hồi thành công
      const parsedResult = JSON.parse(result.toString());
      console.log(parsedResult)
      res.status(200).json({
        message: "Record has been updated successfully",
        transactionResult: parsedResult
      });
    } else {
      console.error('Result is undefined');
      res.status(500).json({ success: false, message: 'Unexpected result from transaction' });
    }

    // Ngắt kết nối khỏi gateway
    await gateway.disconnect();
  } catch (error) {
    console.error(`Failed to submit transaction: ${error.message}`);
    res.status(500).json({ success: false, message: `Failed to update record: ${error.message}` });
  }
}
exports.forgotPassword = async (req, res) => {
  const { cccd } = req.body;
  console.log(req.body);
  const verificationCode = crypto.randomInt(1000, 9999); // Số ngẫu nhiên trong phạm vi từ 100000 đến 999999
  console.log(verificationCode);
const token = await getAccessToken()
console.log('gia tri token'+token);

// console.log(call)
  // Kiểm tra input
  if (!cccd) {
      return res.status(400).json({ success: false, message: 'Invalid input: CCCD is required' });
  }

  let gateway; // Định nghĩa để sử dụng trong `finally`

  try {
      // Kết nối tới mạng
      const { contract, gateway: connectedGateway } = await connectToNetwork();
      gateway = connectedGateway;
      const data = Date.now() + 10 * 60 * 1000;
      // Gửi giao dịch tới chaincode
      const resultBuffer = await contract.submitTransaction('forgotPassword', cccd,data,verificationCode);

      // Chuyển đổi kết quả trả về từ chaincode
      const resultJson = JSON.parse(resultBuffer.toString());
      console.log('Transaction result:', resultJson);
      // const phone =  '84869895748'
      const call = await makeCall(token,resultJson.phone,verificationCode)
      // Kiểm tra kết quả
      if (resultJson.success) {
          res.status(200).json({
              success: true,
              message: 'Verification code has been generated',
              verificationCode: resultJson.verificationCode,
          });
      } else {
          res.status(400).json({ success: false, message: resultJson.message });
      }
  } catch (error) {
      console.error(`Failed to submit transaction: ${error.message}`);
      res.status(500).json({ success: false, message: `Failed to process request: ${error.message}` });
  } finally {
      // Đảm bảo gateway được ngắt kết nối
      if (gateway) {
          try {
              await gateway.disconnect();
          } catch (err) {
              console.error(`Failed to disconnect gateway: ${err.message}`);
          }
      }
  }
};
exports.verifyAndChangePassword = async (req, res) => {
    const { cccd, verificationCode, newpassword } = req.body;

    if (!cccd || !verificationCode || !newpassword) {
        return res.status(400).json({
            success: false,
            message: 'Invalid input: CCCD, verificationCode, and newPassword are required',
        });
    }
    const saltRounds = 10;

    // Hash the password
    const passwordmedicalnew = await bcrypt.hash(newpassword, saltRounds);
    
    let gateway;

    try {
        const { contract, gateway: connectedGateway } = await connectToNetwork();
        gateway = connectedGateway;

        const data = new Date().toISOString(); // Chuỗi thời gian ISO
        const resultBuffer = await contract.submitTransaction(
            'verifyAndChangePassword',
            cccd,
            verificationCode,
            passwordmedicalnew,
            data
        );

        let resultJson;
        try {
            resultJson = JSON.parse(resultBuffer.toString());
        } catch (error) {
            console.error('Failed to parse JSON result:', error.message);
            return res.status(500).json({ success: false, message: 'Invalid response from chaincode' });
        }

        if (resultJson.success) {
            res.status(200).json({
                success: true,
                message: resultJson.message,
            });
        } else {
            res.status(400).json({ success: false, message: resultJson.message });
        }
    } catch (error) {
        console.error(`Failed to submit transaction: ${error.message}`);
        res.status(500).json({ success: false, message: `Failed to process request: ${error.message}` });
    } finally {
        if (gateway) {
            try {
                await gateway.disconnect();
            } catch (err) {
                console.error(`Failed to disconnect gateway: ${err.message}`);
            }
        }
    }
};

exports.registerMedical = async (req, res) => {
  const { name, email, cccd, passwordmedical } = req.body;
  console.log('Request body:', req.body);

  // Validate input
  if (!name || !email || !passwordmedical || !cccd) {
    return res.status(400).json({ success: false, message: 'Invalid input' });
  }

  try {
    // Connect to the network
    const { contract, gateway } = await connectToNetwork();
    const currentTime = new Date();
    const saltRounds = 10;

    // Hash the password
    const passwordmedicalnew = await bcrypt.hash(passwordmedical, saltRounds);

    // Submit transaction
    const result = await contract.submitTransaction('registerMedical', name, email, cccd, passwordmedicalnew, currentTime.toISOString());
    
    const resultJson = JSON.parse(result.toString()); // Chuyển đổi kết quả từ Buffer sang JSON
    console.log('Transaction result:', resultJson);
    
    if (resultJson.success === true) {
      // Return success response
      res.status(200).json({ success: true, message: 'Medical record has been added' });
    } else {
      res.status(400).json({ success: false, message: resultJson.message });
    }

    // Disconnect from the gateway
    await gateway.disconnect();
  } catch (error) {
    console.error(`Failed to submit transaction: ${error.message}`);
    res.status(500).json({ success: false, message: `Failed to add organization: ${error.message}` });
  }
};

exports.getfullRecords= async (req,res) =>{
  try{
    const { contract, gateway } = await connectToNetwork();
    await gateway.disconnect();
    
    const result =  await contract.submitTransaction('getAllMedicalRecords');
        if (result) {
          console.log("Transaction result:", result.toString());
          const parsedResult = JSON.parse(result.toString());

          res.status(200).json({
            message: "Organization has been added successfully",
            transactionResult: parsedResult
        });
        } else {
          console.error("Result is undefined");
          res.status(500).send("Unexpected result from transaction");
        }
  } catch (error) {
    // Xử lý lỗi kết nối hoặc lỗi bất ngờ
    console.error('Error in createUser handler:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}
exports.loginmedical = async (req, res) => {
  let gateway;
  try {
    const { contract, gw } = await connectToNetwork();
    gateway = gw;
    const { cccd, passwordmedical } = req.body;

    const result = await contract.submitTransaction('loginMedical', cccd, passwordmedical);
    // if (!result) return res.status(500).json({ error: "Unexpected result from transaction" });

    const parsedResult = JSON.parse(result.toString());

    // // Check if the structure exists
  
    // console.log(parsedResult.existingRecord.passwordmedical)
    const passwordMatch = await bcrypt.compare(passwordmedical,parsedResult.existingRecord.passwordmedical);
    if (!passwordMatch) return res.status(401).json({ message: "Incorrect password. Please try again." });
    
    const payload = {
      tokenmedical: parsedResult.existingRecord.tokenmedical,
      name: parsedResult.existingRecord.name,
      email: parsedResult.existingRecord.email,
      cccd: parsedResult.existingRecord.cccd
    };

    const secretKey = 'ee2de3938caccb365423140f03873e7b3f2032696632c594131835fe88db55f76f5580f678835c22b578de32cc7ec35d9f0a42a65dec98a839625b5611296e70';
    const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });
    
    res.status(200).json({
      status:true,
      message: "Login has been processed successfully",
      transactionResult: token
    });

  } catch (error) {
    console.error('Error in loginmedical handler:', error);
    res.status(500).json({       status:false
      ,error: 'An unexpected error occurred' });

  } finally {
    if (gateway) await gateway.disconnect();
  }
};


exports.hasAccess= async (req, res) => {
    try{
        const { contract, gateway } = await connectToNetwork();
        const {tokenmedical,tokenorg} =  req.body;
        console.log(req.body);
        if(!tokenmedical){
          return res.status(400).json({ error: 'Missing required fields' });
        }
        try{
       const result =  await contract.submitTransaction('hasAccess',tokenmedical,tokenorg);
        if (result) {
          // console.log("Transaction result:", result.toString());
          const parsedResult = JSON.parse(result.toString());

          res.status(200).json({
            message: "Organization has been added successfully",
            transactionResult: parsedResult
        });
        } else {
          console.error("Result is undefined");
          res.status(500).send("Unexpected result from transaction");
        }
        } catch (error) {
        // Xử lý lỗi kết nối hoặc lỗi bất ngờ
        console.error('Error in createUser handler:', error);
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
      await gateway.disconnect();
    
    
      } catch (error) {
        // Xử lý lỗi kết nối hoặc lỗi bất ngờ
        console.error('Error in createUser handler:', error);
        res.status(500).json({ error: 'An unexpected error occurred' });
      }
};
exports.approveAccess = async (req, res) => {
  let gateway; // Khai báo biến gateway để sử dụng trong finally
  try {
      const { contract, gateway: gw } = await connectToNetwork();
      gateway = gw; // Gán gateway
      const { tokenmedical, tokenorg } = req.body;
      console.log(req.body);

      if (!tokenmedical) {
          return res.status(400).json({ error: 'Missing required fields' });
      }

      try {
          const result = await contract.submitTransaction('approveAccess', tokenmedical, tokenorg);
          if (result) {
              // Cập nhật trạng thái bệnh viện/chi nhánh
              await UpdateStatusHospitalBranchByIds(req.body); // Truyền req.body vào hàm
              res.status(200).send("Organization has been added");
          } else {
              console.error("Result is undefined");
              res.status(500).send("Unexpected result from transaction");
          }
      } catch (error) {
          // Xử lý lỗi kết nối hoặc lỗi bất ngờ
          console.error('Error in approveAccess handler:', error);
          res.status(500).json({ error: 'An unexpected error occurred' });
      }

  } catch (error) {
      // Xử lý lỗi kết nối hoặc lỗi bất ngờ
      console.error('Error in approveAccess handler:', error);
      res.status(500).json({ error: 'An unexpected error occurred' });
  } finally {
      if (gateway) {
          await gateway.disconnect(); // Đảm bảo đóng gateway trong finally
      }
  }
};

exports.getMedicalHistorys = async (req, res) => {
  try {
      const { contract, gateway } = await connectToNetwork();
      const { cccd, tokenmedical } = req.body;

      console.log(req.body);
      if (!cccd || !tokenmedical) {
          return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await contract.submitTransaction('getMedicalHistory', cccd, tokenmedical);
      
      if (result) {
          // Giả định rằng result là một Buffer, chuyển đổi thành chuỗi
          const parsedResult = JSON.parse(result.toString());
          res.status(200).json({ status: true, data: parsedResult });
      } else {
          console.error("Result is undefined");
          res.status(500).json({ error: "Unexpected result from transaction" });
      }

      await gateway.disconnect();
  } catch (error) {
      // Xử lý lỗi mô tả hơn
      console.error('Error in getMedicalHistory handler:', error);
      res.status(500).json({ error: 'An unexpected error occurred', details: error.message });
  }
}

exports.addrequestreacord = async (req,res)=>{
  try{
    const { value,cccd, tokeorg,content ,branch} =  req.body;

    const { contract, gateway } = await connectToNetworkorgvalue(value);
    // console.log(req.body);
    const currentTime = new Date();

    if(!branch || !cccd || !content){
      return res.status(400).json({ error: 'Missing required fields' });
    }
    try{
   const result =  await contract.submitTransaction('addRecordStatusBranch',tokeorg,branch, cccd,content,currentTime);
   console.log("Transaction result:", result.toString());

    if (result) {
      res.status(200).json({
        message: "Organization has been added",
        status: true
      });
          } else {
      console.error("Result is undefined");
      res.status(500).json({
        message: "Organization has been added",
        status: false
      });    }
    } catch (error) {
    // Xử lý lỗi kết nối hoặc lỗi bất ngờ
    console.error('Error in createUser handler:', error);
    console.error("Result is undefined");
    res.status(500).json({
      message: "Organization has been added",
      status: false
    });    }
  await gateway.disconnect();


  } catch (error) {
    // Xử lý lỗi kết nối hoặc lỗi bất ngờ
    console.error('Error in createUser handler:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

exports.requestbookaccess = async (req, res) => {
  try {
    const { value, cccd, tokeorg, content, branch } = req.body;
    console.log(req.body);
    const values = "org1"
    const { contract, gateway } = await connectToNetworkmedicalvalue(value);
    const currentTime = new Date();

    if (!branch || !cccd || !content) {
      return res.status(400).json({ error: 'Missing required fields 400' });
    }

    // Gửi giao dịch requestAccess
    try {
      const result = await contract.submitTransaction('requestAccess', cccd, tokeorg, branch,content, currentTime);
      // await gateway.disconnect();
      const data = JSON.parse(result.toString());

      console.log(data);
      if (result) {
        // console.log("Transaction result:", result.toString());
        // Sau khi thực hiện requestAccess thành công, gọi hàm addrequestreacord
        return await exports.addrequestreacord(req, res);  // Gọi hàm addrequestreacord

      } else {
        console.error("Result is undefined");
        return res.status(500).send("Unexpected result from transaction");
      }

    } catch (error) {
      console.error('Error in requestAccess handler:', error);
      return res.status(500).json({ error: 'An unexpected error occurred in requestAccess' });
    }
  } catch (error) {
    console.error('Error in requestbookaccess handler:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
};

exports.getDataRecord = async (req, res) => {
    const { cccd ,tokenmedical} = req.body;
    console.log(req.body);

    if (!cccd) {
        return res.status(400).send('Invalid input');
    }

    try {
        const { contract, gateway } = await connectToNetwork();
        
        // Sử dụng evaluateTransaction thay vì submitTransaction cho các thao tác đọc
        const result = await contract.evaluateTransaction('getDataRecord', cccd,tokenmedical);
        
        if (result) {
            const medical = JSON.parse(result.toString());

            // console.log('Transaction result:', medical);
            res.status(200).send(medical); // Trả lại kết quả từ chaincode
        } else {
            console.error('Result is undefined');
            res.status(500).send('Unexpected result from transaction');
        }
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error.message}`);
        res.status(500).send(`Failed to get data record: ${error.message}`);
    }             

}
exports.approveAccessRequest = async (req, res) => {
  const { cccd, tokenbranch, tokeorg, fieldsToShare, status } = req.body || {}; // Thêm || {} để đảm bảo không bị undefined
  console.log(req.body);
  const currentTime = new Date();

  // Kiểm tra các tham số
  if (!cccd || !tokeorg || !tokenbranch || !fieldsToShare || status === undefined) {
      return res.status(400).send('Thiếu thông tin yêu cầu hoặc thông tin không hợp lệ.');
  }

  try {
      // Tạo wallet và gateway
      const org1s = "org1";
      const { contract, gateway } = await connectToNetworkmedicalvalue(org1s);

      // Gọi hàm approveAccessRequest trong chaincodecccd, tokeorg, tokenbranch, fieldsToShare, currentTime
      const result = await contract.submitTransaction('approveAccessRequest', cccd, tokeorg, tokenbranch,JSON.stringify(fieldsToShare), currentTime); // Thêm tham số status
      const medical = JSON.parse(result.toString());
      if(medical){
        await UpdateStatusHospitalBranchByIds(req.body); 

      }
      // Đóng gateway
      await gateway.disconnect();

      return res.status(200).send(medical);
  } catch (error) {
      console.error(`Lỗi khi phê duyệt yêu cầu: ${error}`);
      return res.status(500).send(`Lỗi khi phê duyệt yêu cầu: ${error.message}`);
  }
};


exports.getFunaccessRequests = async (req,res)=>{
  try {
    const { cccd,tokenmedical} = req.body; // Get data from request body
    console.log(req.body);
    // Check if all required data is provided
    if (!cccd || !tokenmedical ) {
        return res.status(400).json({ error: 'CCCD, newData, and timepost are required' });
    }

    const { contract, gateway } = await connectToNetwork(); // Connect to the network

    // Call the chaincode function to update the medical record
    const result = await contract.submitTransaction('getDataFunaccessRequests', cccd,tokenmedical);
      console.log(result.toString());
    if (result) {
        // console.log("Transaction result:", result.toString());
        res.status(200).json({
            message: `Record with CCCD ${cccd} has been successfully updated`,
            transactionResult: JSON.parse(result)
        });
    } else {
        console.error("Result is undefined");
        res.status(500).send("Unexpected result from transaction");
    }

    await gateway.disconnect(); // Disconnect the gateway

} catch (error) {
    // Handle connection errors or unexpected errors
    console.error('Error in postDataMedicalExaminationHistory handler:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
}
}

// "cccd": "12300",
// "tokeorg": "1dc11af049aec6665f6411fb15d4ff33bc8480d6f32b0890e929499dfdef8040",
// "tokenbranch": "b7e941cef58027be70d1b275173943ff66ba1210c283bf259a5f6a5e2e5390b5",
// "diseasecodes":"sdfsdfsdfsdf",
// "namedisease":"Bệnh nghèo",
exports.postDataMedicalExaminationHistory = async (req, res) => {
  try {
      const { cccd, newData, timepost ,tokeorg} = req.body; // Get data from request body
      console.log(req.body)

      // Check if all required data is provided
      if (!cccd || !newData || !timepost) {
          return res.status(400).json({ error: 'CCCD, newData, and timepost are required' });
      }

      const { contract, gateway } = await connectToNetwork(); // Connect to the network

      // Call the chaincode function to update the medical record
      const result = await contract.submitTransaction('PostDataMedicalExaminationHistory', cccd,tokeorg, newData, timepost);
      
      if (result) {
          // console.log("Transaction result:", result.toString());
          res.status(200).json({
              message: `Record with CCCD ${cccd} has been successfully updated`,
              transactionResult: result.toString()
          });
      } else {
          console.error("Result is undefined");
          res.status(500).send("Unexpected result from transaction");
      }

      await gateway.disconnect(); // Disconnect the gateway

  } catch (error) {
      // Handle connection errors or unexpected errors
      console.error('Error in postDataMedicalExaminationHistory handler:', error);
      res.status(500).json({ error: 'An unexpected error occurred' });
  }
};


exports.createrecord = async (req, res) => { 
    const {name, birthDate, gender, address, phoneNumber, avatar,cccd,passwordmedical} = req.body;
    console.log('Request body:', req.body);

    if (!name || !birthDate || !gender || !address || !phoneNumber|| !avatar||!cccd)  {
        return res.status(400).send('Invalid input');
    }

    try {
        const { contract, gateway } = await connectToNetwork();
        const currentTime = new Date();
        const saltRounds = 10;
        const passwordmedicalnew = await bcrypt.hash(passwordmedical, saltRounds);

    
        const result = await contract.submitTransaction('createRecord',name, birthDate, gender, address, phoneNumber, avatar,cccd,currentTime,passwordmedicalnew);

        if (result) {
            // console.log('Transaction result:', result.toString());
            res.status(200).send('Organization has been added');
        } else {
            console.error('Result is undefined');
            res.status(500).send('Unexpected result from transaction');
        }

        await gateway.disconnect();
    } catch (error) {
        console.error(`Failed to submit transaction: ${error.message}`);
        res.status(500).send(`Failed to add organization: ${error.message}`);
    }
};
exports.getDataInHospital = async (req,res)=>{
  try {
    const { cccd, tokeorg, tokenbranch} = req.body; // Get data from request body
    console.log(req.body);
    // Check if all required data is provided
    if (!cccd || !tokeorg|| !tokenbranch) {
        return res.status(400).json({ error: 'CCCD, newData, and timepost are required' });
    }

    const { contract, gateway } = await connectToNetwork(); // Connect to the network

    // Call the chaincode function to update the medical record
    const result = await contract.submitTransaction('viewDataByTokenOrg',cccd, tokeorg, tokenbranch);
      // console.log(result.toString());
    if (result) {
        // console.log("Transaction result:", result.toString());
        res.status(200).json({
            message: `Record with CCCD ${cccd} has been successfully updated`,
            transactionResult: JSON.parse(result)
        });
    } else {
        console.error("Result is undefined");
        res.status(500).send("Unexpected result from transaction");
    }

    await gateway.disconnect(); // Disconnect the gateway

} catch (error) {
    // Handle connection errors or unexpected errors
    console.error('Error in postDataMedicalExaminationHistory handler:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
}
}
exports.PushDataInHospital = async (req, res) => {
  try {
    const { cccd, tokeorg, tokenbranch, newData ,diseasecodes,namedisease} = req.body; // Lấy dữ liệu từ yêu cầu
    console.log("ccccd:",cccd );
    console.log("tokeorg:",tokeorg );
    console.log("tokenbranch:",tokenbranch );
    console.log("newData:",newData );
    console.log("diseasecodes:",diseasecodes );
    console.log("namedisease:",namedisease );

    const timecreate = new Date().toISOString(); // Chuyển thành chuỗi thời gian ISO
    const { contract, gateway } = await connectToNetwork(); // Kết nối tới mạng blockchain

    // Gửi giao dịch với newData đã chuyển thành chuỗi JSON
    const result = await contract.submitTransaction(
      'pushData',
      cccd,
      tokeorg,
      tokenbranch,
      JSON.stringify(newData), // Chuyển đổi newData thành chuỗi JSON
      diseasecodes,
      namedisease,
      timecreate
    );

    if (result) {
      // Chuyển đổi kết quả từ buffer nếu cần
      const transactionResult = JSON.parse(result.toString());

      res.status(200).json({
        status:true,
        message: `Record with CCCD ${cccd} has been successfully updated`,
        transactionResult
      });
    } else {
      console.error("Result is undefined");
      res.status(500).send("Unexpected result from transaction");
    }
  } catch (error) {
    // Xử lý lỗi kết nối hoặc lỗi khác
    console.error('Error in PushDataInHospital handler:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
};

exports.getAllDiseaseCode = async (req, res) => {
  try {
    const { cccd,tokenmedical} = req.body; // Lấy dữ liệu từ yêu cầu

    const timecreate = new Date().toISOString(); // Chuyển thành chuỗi thời gian ISO
    const { contract, gateway } = await connectToNetwork(); // Kết nối tới mạng blockchain

    // Gửi giao dịch với newData đã chuyển thành chuỗi JSON
    const result = await contract.submitTransaction(
      'getAllDiseaseCodes',
      cccd,
      tokenmedical,
  
    );

    if (result) {
      // Chuyển đổi kết quả từ buffer nếu cần
      const transactionResult = JSON.parse(result.toString());

      res.status(200).json({
        status:true,
        message: `Record with CCCD ${cccd} has been successfully updated`,
        data:transactionResult
      });
    } else {
      console.error("Result is undefined");
      res.status(500).send("Unexpected result from transaction");
    }
  } catch (error) {
    // Xử lý lỗi kết nối hoặc lỗi khác
    console.error('Error in PushDataInHospital handler:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
};
exports.getByDiseaseCodeDetail = async (req, res) => {
  try {
    const { cccd, tokenmedical, diseasecode} = req.body; // Lấy dữ liệu từ yêu cầu
    console.log(req.body);
    const timecreate = new Date().toISOString(); // Chuyển thành chuỗi thời gian ISO
    const { contract, gateway } = await connectToNetwork(); // Kết nối tới mạng blockchain

    // Gửi giao dịch với newData đã chuyển thành chuỗi JSON
    const result = await contract.submitTransaction(
      'getDiseaseCodeDetails',
      cccd, tokenmedical, diseasecode
  
    );

    if (result) {
      // Chuyển đổi kết quả từ buffer nếu cần
      const transactionResult = JSON.parse(result.toString());

      res.status(200).json({
        status:true,
        message: `Record with CCCD ${cccd} has been successfully updated`,
        data:transactionResult
      });
    } else {
      console.error("Result is undefined");
      res.status(500).send("Unexpected result from transaction");
    }
  } catch (error) {
    // Xử lý lỗi kết nối hoặc lỗi khác
    console.error('Error in PushDataInHospital handler:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
};

exports.getFieldsToShares = async (req, res) => {
  try {
    const { cccd, tokeorg, tokenbranch} = req.body; // Lấy dữ liệu từ yêu cầu

    const timecreate = new Date().toISOString(); // Chuyển thành chuỗi thời gian ISO
    const { contract, gateway } = await connectToNetwork(); // Kết nối tới mạng blockchain

    // Gửi giao dịch với newData đã chuyển thành chuỗi JSON
    const result = await contract.submitTransaction(
      'getFieldsToShare',
      cccd,
      tokeorg,
      tokenbranch
  
    );

    if (result) {
      // Chuyển đổi kết quả từ buffer nếu cần
      const transactionResult = JSON.parse(result.toString());

      res.status(200).json({
        status:true,
        message: `Record with CCCD ${cccd} has been successfully updated`,
        data:transactionResult
      });
    } else {
      console.error("Result is undefined");
      res.status(500).send("Unexpected result from transaction");
    }
  } catch (error) {
    // Xử lý lỗi kết nối hoặc lỗi khác
    console.error('Error in PushDataInHospital handler:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
};
exports.getDiseaseDetailsByCodes = async (req, res) => {
  try {
    const { cccd, tokeorg, tokenbranch, diseasecode} = req.body; // Lấy dữ liệu từ yêu cầu

    const timecreate = new Date().toISOString(); // Chuyển thành chuỗi thời gian ISO
    const { contract, gateway } = await connectToNetwork(); // Kết nối tới mạng blockchain

    // Gửi giao dịch với newData đã chuyển thành chuỗi JSON
    const result = await contract.submitTransaction(
      'getDiseaseDetailsByCode',
      cccd, tokeorg, tokenbranch, diseasecode
  
    );

    if (result) {
      // Chuyển đổi kết quả từ buffer nếu cần
      const transactionResult = JSON.parse(result.toString());

      res.status(200).json({
        status:true,
        message: `Record with CCCD ${cccd} has been successfully updated`,
        data:transactionResult
      });
    } else {
      console.error("Result is undefined");
      res.status(500).send("Unexpected result from transaction");
    }
  } catch (error) {
    // Xử lý lỗi kết nối hoặc lỗi khác
    console.error('Error in PushDataInHospital handler:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
};