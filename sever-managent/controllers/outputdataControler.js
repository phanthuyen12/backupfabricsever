const path = require("path");
const fs = require("fs");
const { Gateway, Wallets } = require("fabric-network");
const { exec } = require('child_process');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { connectToNetworkorgvalue ,connectToNetworkorg,connectToNetwork,connectToNetworkmedicalvalue} = require('../controllers/network');
exports.CountHospital = async (req, res) => {
    let gateway;
    try {
      const { tokenorg, oldTokenUser, newTokenUser } = req.body;
      console.log(req.body);
  
      const value = "org1";
      // Kết nối tới network
      const { contract, gateway: gw } = await connectToNetworkorgvalue(value);
      gateway = gw;
  
      // Gửi transaction để thay đổi admin
      const result = await contract.submitTransaction("countOrganizations");
  
      // Kiểm tra nếu có kết quả trả về
      if (result) {
        // Chuyển đổi chuỗi JSON thành object và trả về kết quả dưới dạng JSON
        const organizations = JSON.parse(result.toString());
  
        // Thêm status vào kết quả trả về
        return res.status(200).json({
          status: true,
          data: organizations
        });
      } else {
        return res.status(404).json({
          status: false,
          message: "No organizations found"
        });
      }
    } catch (error) {
      console.error(`Failed to submit transaction: ${error.message}`);
      return res.status(500).json({
        status: false,
        error: `Failed to retrieve organizations: ${error.message}`
      });
    } finally {
      if (gateway) {
        await gateway.disconnect();
      }
    }
  };
  exports.CountMedical = async (req, res) => {
    let gateway;
    try {
      const { tokenorg, oldTokenUser, newTokenUser } = req.body;
      console.log(req.body);
  
      const value = "org1";
      // Kết nối tới network
      const { contract, gateway: gw } = await connectToNetworkmedicalvalue(value);
      gateway = gw;
  
      // Gửi transaction để thay đổi admin
      const result = await contract.submitTransaction("countTotalExaminations");
  
      // Kiểm tra nếu có kết quả trả về
      if (result) {
        // Chuyển đổi chuỗi JSON thành object và trả về kết quả dưới dạng JSON
        const organizations = JSON.parse(result.toString());
  
        // Thêm status vào kết quả trả về
        return res.status(200).json({
          status: true,
          data: organizations
        });
      } else {
        return res.status(404).json({
          status: false,
          message: "No organizations found"
        });
      }
    } catch (error) {
      console.error(`Failed to submit transaction: ${error.message}`);
      return res.status(500).json({
        status: false,
        error: `Failed to retrieve organizations: ${error.message}`
      });
    } finally {
      if (gateway) {
        await gateway.disconnect();
      }
    }
  };
  exports.CountUser = async (req, res) => {
    let gateway;
    try {
      const { tokenorg, oldTokenUser, newTokenUser } = req.body;
      console.log(req.body);
  
      const value = "org1";
      // Kết nối tới network
      const { contract, gateway: gw } = await connectToNetworkorgvalue(value);
      gateway = gw;
  
      // Gửi transaction để thay đổi admin
      const result = await contract.submitTransaction("countTotalUsers");
  
      // Kiểm tra nếu có kết quả trả về
      if (result) {
        // Chuyển đổi chuỗi JSON thành object và trả về kết quả dưới dạng JSON
        const organizations = JSON.parse(result.toString());
  
        // Thêm status vào kết quả trả về
        return res.status(200).json({
          status: true,
          data: organizations
        });
      } else {
        return res.status(404).json({
          status: false,
          message: "No organizations found"
        });
      }
    } catch (error) {
      console.error(`Failed to submit transaction: ${error.message}`);
      return res.status(500).json({
        status: false,
        error: `Failed to retrieve organizations: ${error.message}`
      });
    } finally {
      if (gateway) {
        await gateway.disconnect();
      }
    }
  };