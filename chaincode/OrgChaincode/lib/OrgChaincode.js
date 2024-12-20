const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');

class OrgChaincode extends Contract {

  // Khởi tạo ledger với dữ liệu mẫu
  async initLedger(ctx) {
    const organizations = [{
      nameorg: "hostbenh",
      nameadmin: 'phangiathuyen',
      emailadmin: 'thuyendi2004@gmail.com',
      addressadmin: '48/5btokyquan12',
      phoneadmin: '0869895748',
      businessBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAADTz',
      tokeorg: 'orgToken123',
      statusOrg: 'false',
      Syncstatus:'false',
      hospitalbranch: [],
      users: [
        {
          fullname: 'thuyendi2004@gmail',
          address: '48/5btokyquan12',
          organizationalvalue: '432545354',
          phone: '0869895748',
          typeusers: 'admin',
          branch:'sdfsdfsdf',
          imgidentification:'sdfiughys89dfy9sd8sdfsdfds',
          cccd: '0869895748',
          password: 'djfhdkjfhdfkjg',
          tokenuser: 'sdfhsdfkjhsfkjhs8437sdjkfksdfh',
          timecreats: 'sdfhsdfkjhsfkjhs8437sdjkfksdfh',
          historyUser: [],
        }
      ],
      historyOrg: [] // Thêm trường lịch sử cho tổ chức
    }];

    for (let i = 0; i < organizations.length; i++) {
      const org = organizations[i];
      const publicOrg = {
        nameadmin: org.nameadmin,
        emailadmin: org.emailadmin,
        addressadmin: org.addressadmin,
        phoneadmin: org.phoneadmin,
        tokeorg: org.tokeorg,
        historyOrg: []
      };
      await ctx.stub.putState(org.tokeorg, Buffer.from(JSON.stringify(publicOrg)));
      console.log('Added organization:', publicOrg);
    }
  }
  
  async getFullHospitalBranches(ctx, tokeorg) {
    // Lấy trạng thái của tổ chức từ state database bằng mã token
    const orgAsBytes = await ctx.stub.getState(tokeorg);
    
    // Kiểm tra nếu không tìm thấy tổ chức với mã token
    if (!orgAsBytes || orgAsBytes.length === 0) {
        throw new Error(`Organization with token ${tokeorg} does not exist`);
    }

    // Chuyển đổi dữ liệu tổ chức từ bytes sang đối tượng JSON
    const org = JSON.parse(orgAsBytes.toString());

    // Kiểm tra và lấy danh sách bệnh viện
    const hospitalBranches = org.hospitalbranch || [];

    // Trả về danh sách bệnh viện
    return hospitalBranches;
}
async countStatus(ctx) {
    const queryString = {
        selector: {} // Lấy tất cả các bản ghi trong ledger
    };

    const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
    let totalTrue = 0;
    let totalFalse = 0;

    while (true) {
        const res = await iterator.next();

        if (res.value && res.value.value.toString()) {
            const record = JSON.parse(res.value.value.toString('utf8'));

            // Kiểm tra trạng thái của tổ chức
            if (record.statusOrg === "true") {
                totalTrue++;
            } else if (record.statusOrg === "false") {
                totalFalse++;
            }
        }

        if (res.done) {
            await iterator.close();
            break;
        }
    }

    return { totalTrue, totalFalse };
}

async countOrganizations(ctx) {
    const hospitalKey = 'datahospital'; // Key để lấy danh sách tổ chức
    const hospitalTokensBuffer = await ctx.stub.getState(hospitalKey);

    // Kiểm tra nếu danh sách tổ chức không tồn tại hoặc trống
    if (!hospitalTokensBuffer || hospitalTokensBuffer.length === 0) {
        return 0; // Không có tổ chức nào
    }

    const hospitalTokens = JSON.parse(hospitalTokensBuffer.toString());
    return hospitalTokens.length; // Trả về số lượng tổ chức
}

// async updateOrganizationStatus(ctx, tokeorg, newStatus,datatime) {
//     // Kiểm tra nếu token tổ chức không tồn tại
//     const orgBytes = await ctx.stub.getState(tokeorg);
//     if (!orgBytes || orgBytes.length === 0) {
//         throw new Error(`Organization with token ${tokeorg} does not exist`);
//     }

//     // Lấy dữ liệu tổ chức từ blockchain
//     const organization = JSON.parse(orgBytes.toString());

//     // Cập nhật trạng thái tổ chức
//     const oldStatus = organization.statusOrg; // Trạng thái cũ
//     organization.statusOrg = newStatus;

//     // Thêm lịch sử thay đổi trạng thái vào historyOrg
//     organization.historyOrg.push({
//         action: 'UPDATE_STATUS',
//         timestamp: datatime,
//         oldStatus,
//         newStatus,
//     });

//     // Lưu lại dữ liệu tổ chức sau khi cập nhật
//     await ctx.stub.putState(tokeorg, Buffer.from(JSON.stringify(organization)));

//     console.log(`Updated organization status for ${tokeorg} from ${oldStatus} to ${newStatus}`);
//     return {
//         success: true,
//         message: `Organization status updated from ${oldStatus} to ${newStatus}`,
//     };
// }

async getBranchDetails(ctx, tokeorg, tokenbranch) {
  // Lấy danh sách tất cả các tổ chức từ 'datahospital'
  const hospitalKey = 'datahospital';
  const hospitalTokensBuffer = await ctx.stub.getState(hospitalKey);
  
  if (!hospitalTokensBuffer || hospitalTokensBuffer.length === 0) {
      throw new Error('No organizations found in the system');
  }

  const hospitalTokens = JSON.parse(hospitalTokensBuffer.toString());

  // Tìm tổ chức với tokeorg
  if (!hospitalTokens.includes(tokeorg)) {
      throw new Error(`Organization with token ${tokeorg} does not exist`);
  }

  // Lấy thông tin của tổ chức từ tokeorg
  const orgBytes = await ctx.stub.getState(tokeorg);
  if (!orgBytes || orgBytes.length === 0) {
      throw new Error(`Organization with token ${tokeorg} does not exist`);
  }

  const org = JSON.parse(orgBytes.toString());

  // Tìm chi nhánh theo tokenbranch
  const branch = org.hospitalbranch.find(item => item.tokenbranch === tokenbranch);
  if (!branch) {
      throw new Error(`Branch with token ${tokenbranch} does not exist in organization ${tokeorg}`);
  }

  return branch;
}


 
  async createOrganization(ctx, currentTime, nameorg, nameadmin, emailadmin, addressadmin, cccdadmin, phoneadmin, passwordadmin, businesslicense) {
    const txId = ctx.stub.getTxID();
    const tokeorg = this.hasDataToken(nameorg, txId); // Tạo token tổ chức

    // Kiểm tra tổ chức đã tồn tại chưa
    const orgExists = await this.organizationExists(ctx, tokeorg);
    if (orgExists) {
        throw new Error(`Organization with token ${tokeorg} already exists`);
    }

    // Kiểm tra xem có bệnh viện nào có tên trùng với nameorg không
    const hospitalKey = 'datahospital';
    const hospitalTokensBuffer = await ctx.stub.getState(hospitalKey);
    let hospitalTokens = [];

    if (hospitalTokensBuffer && hospitalTokensBuffer.length > 0) {
        hospitalTokens = JSON.parse(hospitalTokensBuffer.toString());
    }

    // Kiểm tra các tổ chức đã tồn tại
    for (const token of hospitalTokens) {
        const orgDataBuffer = await ctx.stub.getState(token);
        if (orgDataBuffer) {
            const orgData = JSON.parse(orgDataBuffer.toString());
            // Kiểm tra tên tổ chức
            if (orgData.nameorg === nameorg) {
                throw new Error(`An organization with the name ${nameorg} already exists`);
            }
        }
    }

    // Tạo đối tượng tổ chức mới
    const organization = {
        nameorg,
        nameadmin,
        emailadmin,
        addressadmin,
        phoneadmin,
        businesslicense,
        timestamp: currentTime,
        hospitalbranch: [],
        tokeorg: tokeorg,
        statusOrg: 'false',
        Syncstatus: 'false',
        users: [],
        historyOrg: [], // Lịch sử khởi tạo tổ chức
        passiente:[]
    };

    // Thêm hành động khởi tạo vào lịch sử tổ chức
    organization.historyOrg.push({
        action: 'CREATE_ORG',
        timestamporg: currentTime,
        data: { nameorg, nameadmin, emailadmin, addressadmin, phoneadmin, businesslicense }
    });

    // Lưu dữ liệu tổ chức vào public state
    await ctx.stub.putState(tokeorg, Buffer.from(JSON.stringify(organization)));

    // Lưu token của tổ chức vào danh sách tổ chức
    // Thêm token mới vào danh sách token tổ chức
    hospitalTokens.push(tokeorg);
    await ctx.stub.putState(hospitalKey, Buffer.from(JSON.stringify(hospitalTokens))); // Lưu danh sách token vào public state

    console.log(`Organization ${nameorg} created with admin ${nameadmin}`);
    return tokeorg; // Trả về token tổ chức
}
async countTotalUsers(ctx) {
    const hospitalKey = 'datahospital'; // Key để lấy danh sách tổ chức
    const hospitalTokensBuffer = await ctx.stub.getState(hospitalKey);

    // Kiểm tra nếu danh sách tổ chức không tồn tại hoặc trống
    if (!hospitalTokensBuffer || hospitalTokensBuffer.length === 0) {
        return 0; // Không có tổ chức nào, do đó không có user nào
    }

    const hospitalTokens = JSON.parse(hospitalTokensBuffer.toString());
    let totalUsers = 0;

    for (const token of hospitalTokens) {
        // Lấy thông tin tổ chức từ token
        const orgDataBuffer = await ctx.stub.getState(token);
        if (orgDataBuffer && orgDataBuffer.length > 0) {
            const orgData = JSON.parse(orgDataBuffer.toString());
            // Lấy danh sách users và tính tổng
            if (orgData.users && Array.isArray(orgData.users)) {
                totalUsers += orgData.users.length;
            }
        }
    }

    return totalUsers; // Trả về tổng số user
}

async changeAdminToDoctor(ctx, tokeorg, oldTokenUser, newTokenUser) {
    const txId = ctx.stub.getTxID();

    // Lấy dữ liệu bệnh viện từ public ledger (hospital tokens)
    const hospitalKey = 'datahospital';
    const hospitalTokensBuffer = await ctx.stub.getState(hospitalKey);
    
    if (!hospitalTokensBuffer || hospitalTokensBuffer.length === 0) {
        throw new Error(`Hospital data with key ${hospitalKey} does not exist`);
    }

    let hospitalTokens = JSON.parse(hospitalTokensBuffer.toString());
    
    // Kiểm tra xem tổ chức (hospital) có tồn tại trong dữ liệu bệnh viện hay không
    const hospitalExists = hospitalTokens.includes(tokeorg);
    if (!hospitalExists) {
        throw new Error(`Hospital with token ${tokeorg} does not exist in hospital data`);
    }

    // Lấy dữ liệu tổ chức từ public ledger
    const orgAsBytes = await ctx.stub.getState(tokeorg);
    if (!orgAsBytes || orgAsBytes.length === 0) {
        throw new Error(`Organization with token ${tokeorg} does not exist`);
    }

    const org = JSON.parse(orgAsBytes.toString());

    // Tìm và thay đổi quyền admin cũ thành doctor
    let oldUserIndex = -1;
    for (let i = 0; i < org.users.length; i++) {
        if (org.users[i].tokenuser === oldTokenUser) {
            oldUserIndex = i;
            break;
        }
    }

    if (oldUserIndex === -1) {
        throw new Error(`User with token ${oldTokenUser} does not exist in the organization`);
    }

    // Cập nhật quyền cho user cũ
    org.users[oldUserIndex].typeusers = 'doctor';  // Chuyển quyền admin thành doctor

    // Tìm và cập nhật quyền admin mới thành superadmin
    let newUserIndex = -1;
    for (let i = 0; i < org.users.length; i++) {
        if (org.users[i].tokenuser === newTokenUser) {
            newUserIndex = i;
            break;
        }
    }

    if (newUserIndex === -1) {
        throw new Error(`User with token ${newTokenUser} does not exist in the organization`);
    }

    // Cập nhật quyền cho user mới
    org.users[newUserIndex].typeusers = 'superadmin';  // Chuyển quyền thành superadmin

    // Thêm hành động vào lịch sử của tổ chức
    const currentTime = new Date().toISOString();
    org.historyOrg.push({
        action: 'CHANGE_USER_ROLE',
        timestamporg: currentTime,
        data: {
            oldTokenUser,
            newTokenUser,
            oldRole: 'admin',
            newRole: 'doctor', // Đổi quyền của admin cũ thành doctor
            newRoleSuperAdmin: 'superadmin', // Đổi quyền của admin mới thành superadmin
        }
    });

    // Lưu lại dữ liệu tổ chức vào public ledger
    await ctx.stub.putState(tokeorg, Buffer.from(JSON.stringify(org)));

    console.log(`Admin with token ${oldTokenUser} changed to doctor, and admin with token ${newTokenUser} changed to superadmin in organization ${tokeorg}`);
    return `Admin with token ${oldTokenUser} changed to doctor, and admin with token ${newTokenUser} changed to superadmin`;
}

async createAdmin(ctx, tokeorg, fullname, address, phone, cccd, password, organizationalvalue,License,imgidentification,avatar) {
    const txId = ctx.stub.getTxID();
    const tokenuser = this.hasDataToken(fullname, txId);
  
    // Sử dụng getState để lấy dữ liệu của tổ chức từ public ledger
    const orgAsBytes = await ctx.stub.getState(tokeorg);
    if (!orgAsBytes || orgAsBytes.length === 0) {
        throw new Error(`Organization with token ${tokeorg} does not exist`);
    }
  
    const org = JSON.parse(orgAsBytes.toString());
  
    // Xử lý hash password nếu cần để bảo mật
    const newUser = {
        fullname,
        address,
        phone,
        typeusers: 'superadmin',
        cccd,
        password, // Lưu password đã hash nếu cần
        organizationalvalue,
        tokenuser,
        License,imgidentification,avatar,
        historyUser: []
    };
  
    // Lưu lại lịch sử tạo người dùng
    newUser.historyUser.push({
        action: 'CREATE_USER',
        data: { fullname, address, phone, typeusers: 'superadmin', cccd ,License,imgidentification,avatar}
    });
  
    // Thêm người dùng mới vào danh sách người dùng của tổ chức
    org.users.push(newUser);
  
    // Thêm hành động thêm người dùng vào lịch sử của tổ chức
    org.historyOrg.push({
        action: 'ADD_USER',
        data: { fullname, tokenuser }
    });
  
    // Lưu lại dữ liệu tổ chức vào public ledger
    await ctx.stub.putState(tokeorg, Buffer.from(JSON.stringify(org)));
  
    console.log(`Admin ${fullname} created in organization ${tokeorg}`);
    return tokenuser; // Trả về token người dùng mới
  }
// {value, tokeorg, branch, imgidentification, fullname, address, phone, typeusers, cccd, password ,License,avatar,specialized}
async getSuperAdmin(ctx, tokeorg) {
  // Kiểm tra tổ chức tồn tại
  const orgAsBytes = await ctx.stub.getState(tokeorg);
  if (!orgAsBytes || orgAsBytes.length === 0) {
      throw new Error(`Organization with token ${tokeorg} does not exist`);
  }

  const org = JSON.parse(orgAsBytes.toString());

  // Duyệt qua danh sách người dùng của tổ chức để tìm superadmin
  const superAdmin = org.users.find(user => user.typeusers === 'superadmin');
  if (!superAdmin) {
      throw new Error(`No superadmin found in organization with token ${tokeorg}`);
  }

  // Trả về thông tin của superadmin
  return superAdmin;
}



//   async getfunOrganizations(ctx) {
//     const collectionName = `myPrivateCollection_Org1`; // Tên của collection riêng tư
//     const activeOrgs = [];
    
//     // Lấy tất cả các token của tổ chức (giả sử bạn đã lưu chúng trong ledger riêng tư)
//     const iterator = await ctx.stub.getPrivateDataByRangeByRange(collectionName, '', ''); // Lấy tất cả mục từ collection

//     // Duyệt qua các mục
//     while (true) {
//         const res = await iterator.next();
//         if (res.done) {
//             break;
//         }

//         const value = res.value.value.toString('utf8');
//         const org = JSON.parse(value);

//         // Thêm toàn bộ dữ liệu tổ chức vào danh sách
//         activeOrgs.push(org);
//     }

//     // Đóng iterator
//     await iterator.close();

//     return activeOrgs; // Trả về toàn bộ dữ liệu tổ chức
// }
async changeSuperAdmin(ctx, tokeorg, currentSuperAdminToken, newSuperAdminToken,data) {
  try {
      // Kiểm tra tổ chức tồn tại
      const orgAsBytes = await ctx.stub.getState(tokeorg);
      if (!orgAsBytes || orgAsBytes.length === 0) {
          console.error(`Organization with token ${tokeorg} does not exist`);
          return false;
      }

      const org = JSON.parse(orgAsBytes.toString());

    //   // Kiểm tra tài khoản hiện tại là superadmin
      const currentSuperAdmin = org.users.find(user => user.tokenuser === currentSuperAdminToken );
      if (!currentSuperAdmin) {
          console.error(`The token ${currentSuperAdminToken} is not associated with a superadmin in organization ${tokeorg}`);
          return false;
      }

    //   // Kiểm tra tài khoản mới tồn tại
      const newAdmin = org.users.find(user => user.tokenuser === newSuperAdminToken);
      if (!newAdmin) {
          console.error(`The token ${newSuperAdminToken} does not match any user in organization ${tokeorg}`);
          return false;
      }

    //   // Thay đổi vai trò
      currentSuperAdmin.typeusers = 'admin';
      newAdmin.typeusers = 'superadmin';

    //   // Ghi lại lịch sử thay đổi trong tổ chức
      org.historyOrg.push({
          action: 'CHANGE_SUPERADMIN',
          timestamporg: data,
          data: {
              oldSuperAdmin: currentSuperAdminToken,
              newSuperAdmin: newSuperAdminToken
          }
      });

      // Lưu lại thay đổi vào public ledger
      await ctx.stub.putState(tokeorg, Buffer.from(JSON.stringify(org)));

    //   console.log(`Superadmin changed from ${currentSuperAdminToken} to ${newSuperAdminToken} in organization ${tokeorg}`);
      return true; // Thành công
  } catch (error) {
      console.error(`Failed to change superadmin: ${error.message}`);
      return false; // Thất bại
  }
}


async createrdetailbranch(ctx, tokeorg, branchname, branchaddress, branchphone, branchemail, branchbusinesslicense, timecreate) {
  // Lấy danh sách tất cả các tổ chức từ 'datahospital'
  const hospitalKey = 'datahospital';
  const hospitalTokensBuffer = await ctx.stub.getState(hospitalKey);

  if (!hospitalTokensBuffer || hospitalTokensBuffer.length === 0) {
      throw new Error('No organizations found in the system');
  }

  const hospitalTokens = JSON.parse(hospitalTokensBuffer.toString());

  // Tìm tổ chức với tokeorg
  if (!hospitalTokens.includes(tokeorg)) {
      throw new Error(`Organization with token ${tokeorg} does not exist`);
  }

  // Lấy dữ liệu tổ chức theo token
  const orgAsBytes = await ctx.stub.getState(tokeorg);
  if (!orgAsBytes || orgAsBytes.length === 0) {
      throw new Error(`Tổ chức với token ${tokeorg} không tồn tại`);
  }

  // Tạo token chi nhánh
  const tokenbranch = this.hasDataToken(branchname, tokeorg);

  // Parse dữ liệu tổ chức
  const org = JSON.parse(orgAsBytes.toString());

  // Kiểm tra xem chi nhánh đã tồn tại chưa
  const existingBranch = org.hospitalbranch.find(item => item.tokenbranch === tokenbranch);
  if (existingBranch) {
      throw new Error(`Branch with token ${tokenbranch} already exists in organization ${tokeorg}`);
  }

  // Tạo chi nhánh mới
  const newbranch = {
      tokenbranch,
      branchname,
      branchaddress,
      branchphone,
      branchemail,
      branchbusinesslicense,
      timecreate,
      patient: [],
      recordstatus: [],
  };

  // Thêm lịch sử tạo chi nhánh
  org.historyOrg.push({
      action: 'CREATE_BRANCH',
      timestamp: timecreate,
      data: newbranch
  });

  // Thêm chi nhánh vào tổ chức
  org.hospitalbranch.push(newbranch);

  // Cập nhật lại trạng thái của tổ chức
  await ctx.stub.putState(tokeorg, Buffer.from(JSON.stringify(org)));

  console.log(`Chi nhánh ${branchname} được tạo với token ${tokenbranch} trong tổ chức ${tokeorg}`);

  return tokenbranch;
}
async getHospitalBranchById(ctx, tokeorg, tokenbranch) {
  const hospitalKey = 'datahospital';

  // Lấy danh sách token của tổ chức từ state thông qua key 'datahospital'
  const hospitalTokensBuffer = await ctx.stub.getState(hospitalKey);
  if (!hospitalTokensBuffer || hospitalTokensBuffer.length === 0) {
      throw new Error(`Không có tổ chức nào được đăng ký.`);
  }

  const hospitalTokens = JSON.parse(hospitalTokensBuffer.toString());

  // Kiểm tra xem tokeorg có nằm trong danh sách tổ chức không
  if (!hospitalTokens.includes(tokeorg)) {
      throw new Error(`Tổ chức với token ${tokeorg} không tồn tại trong danh sách tổ chức.`);
  }

  // Lấy thông tin tổ chức (org) dựa trên token tổ chức (tokeorg)
  const orgAsBytes = await ctx.stub.getState(tokeorg);
  if (!orgAsBytes || orgAsBytes.length === 0) {
      throw new Error(`Tổ chức với token ${tokeorg} không tồn tại.`);
  }

  // Chuyển đổi dữ liệu tổ chức từ bytes thành đối tượng JSON
  const org = JSON.parse(orgAsBytes.toString());

  // Lọc các bản ghi bệnh nhân theo chi nhánh
  const recordsByBranch = org.passiente.filter(record => record.branch === tokenbranch);

  if (recordsByBranch.length === 0) {
      throw new Error(`Không có bản ghi nào trong chi nhánh ${tokenbranch} của tổ chức ${tokeorg}.`);
  }

  // Đếm tổng số `status` true và false
  const statusCount = recordsByBranch.reduce(
      (count, record) => {
          if (record.status === 'true') {
              count.true += 1;
          } else if (record.status === 'false') {
              count.false += 1;
          }
          return count;
      },
      { true: 0, false: 0 } // Khởi tạo giá trị ban đầu
  );

  // Thêm tổng số lượng `true` và `false`
  const total = statusCount.true + statusCount.false;

  return {
      records: recordsByBranch, // Trả về danh sách các bản ghi
      statusCount, // Trả về đếm tổng số `status` true và false
      total // Tổng số lượng `true` và `false`
  };
}


async addRecordStatusBranch(ctx, tokeorg, brach, cccd, content, timerequest) {
  const hospitalKey = 'datahospital';

  // Lấy danh sách token của tổ chức từ state thông qua key 'datahospital'
  const hospitalTokensBuffer = await ctx.stub.getState(hospitalKey);
  if (!hospitalTokensBuffer || hospitalTokensBuffer.length === 0) {
      throw new Error(`Không có tổ chức nào được đăng ký.`);
  }

  const hospitalTokens = JSON.parse(hospitalTokensBuffer.toString());

  // Kiểm tra xem tokeorg có nằm trong danh sách tổ chức không
  if (!hospitalTokens.includes(tokeorg)) {
      throw new Error(`Tổ chức với token ${tokeorg} không tồn tại trong danh sách tổ chức.`);
  }

  // Lấy thông tin tổ chức (org) dựa trên token tổ chức (tokeorg)
  const orgAsBytes = await ctx.stub.getState(tokeorg);
  if (!orgAsBytes || orgAsBytes.length === 0) {
      throw new Error(`Tổ chức với token ${tokeorg} không tồn tại.`);
  }

  // Chuyển đổi dữ liệu tổ chức từ bytes thành đối tượng JSON
  const org = JSON.parse(orgAsBytes.toString());

  // Khởi tạo mảng passiente nếu chưa tồn tại
  org.passiente = org.passiente || [];

  // Tạo bản ghi mới
  const newRecord = {
      cccd: cccd,
      tokeorg:tokeorg,
      branch:brach,
      content: content,
      timerequest: timerequest,
      branch: brach, // Đảm bảo rằng tên trường là 'branch'
      status: "false" // Hoặc bất kỳ trạng thái mặc định nào
  };

  // Thêm bản ghi mới vào mảng passiente
  org.passiente.push(newRecord);

  // Cập nhật lại thông tin tổ chức với bản ghi mới
  await ctx.stub.putState(tokeorg, Buffer.from(JSON.stringify(org))); // Sử dụng tokeorg làm khóa

  return {
    status: true,
    message: `Bản ghi với CCCD ${cccd} đã được thêm trong chi nhánh với token ${brach} trong tổ chức ${tokeorg}.`,
};}


async updateRecordStatusBranch(ctx, tokeorg, brach, cccd, newstatus, newTimerequest) {
  const hospitalKey = 'datahospital';

  // Lấy danh sách token của tổ chức từ state thông qua key 'datahospital'
  const hospitalTokensBuffer = await ctx.stub.getState(hospitalKey);
  if (!hospitalTokensBuffer || hospitalTokensBuffer.length === 0) {
      throw new Error(`Không có tổ chức nào được đăng ký.`);
  }

  const hospitalTokens = JSON.parse(hospitalTokensBuffer.toString());

  // Kiểm tra xem tokeorg có nằm trong danh sách tổ chức không
  if (!hospitalTokens.includes(tokeorg)) {
      throw new Error(`Tổ chức với token ${tokeorg} không tồn tại trong danh sách tổ chức.`);
  }

  // Lấy thông tin tổ chức (org) dựa trên token tổ chức (tokeorg)
  const orgAsBytes = await ctx.stub.getState(tokeorg);
  if (!orgAsBytes || orgAsBytes.length === 0) {
      throw new Error(`Tổ chức với token ${tokeorg} không tồn tại.`);
  }

  // Chuyển đổi dữ liệu tổ chức từ bytes thành đối tượng JSON
  const org = JSON.parse(orgAsBytes.toString());

  // Tìm kiếm bản ghi trong mảng passiente dựa trên số CCCD
  const recordToUpdate = org.passiente.find(record => record.cccd === cccd && record.branch === brach);
  if (!recordToUpdate) {
      throw new Error(`Bản ghi với CCCD ${cccd} không tồn tại trong chi nhánh ${brach} của tổ chức ${tokeorg}.`);
  }

  // Cập nhật thông tin bản ghi
  recordToUpdate.timerequest = newTimerequest; // Cập nhật thời gian yêu cầu
  recordToUpdate.status = newstatus; // Cập nhật trạng thái

  // Cập nhật lại thông tin tổ chức với bản ghi đã được cập nhật
  await ctx.stub.putState(tokeorg, Buffer.from(JSON.stringify(org)));
  return {
    status: true,
    message: `Bản ghi với CCCD ${cccd} đã được cập nhật trong chi nhánh với token ${brach} trong tổ chức ${tokeorg}.`,
    data: recordToUpdate // Trả về bản ghi đã được cập nhật
};
}


  // Đăng nhập người dùng vào tổ chức
  async loginOrganization(ctx, tokeorg, cccd) {
    // Lấy thông tin của tổ chức dựa trên token (tokeorg)
    const orgAsBytes = await ctx.stub.getState(tokeorg);
    if (!orgAsBytes || orgAsBytes.length === 0) {
      throw new Error(`Tổ chức với token ${tokeorg} không tồn tại`);
    }

    // Phân tích chi tiết tổ chức
    const org = JSON.parse(orgAsBytes.toString());

    // Tìm kiếm người dùng dựa trên cccd
    const user = org.users.find(user => user.cccd === cccd);

    if (!user) {
      throw new Error('Người dùng không tồn tại trong tổ chức này');
    }

    // Trả về thông tin người dùng mà không thực hiện xác thực mật khẩu trong chaincode
    return {
      message: `Thông tin người dùng: ${user.fullname}`,
      tokenuser: user.tokenuser,  // Token này có thể dùng cho phiên hoặc xác thực JWT
      typeusers: user.typeusers,
      branch: user.branch,
      nameorg: org.nameorg,
      specialized: user.specialized,
      tokeorg: org.tokeorg,
      passwordvalue: user.password,
      user: user,
    };
  }

  async createpersonnel(ctx, tokeorg, branch, fullname, address, phone, typeusers, cccd, password, imgidentification, timecreats,License,avatar,specialized) {
    try {
        const txId = ctx.stub.getTxID();
        const tokenuser = this.hasDataToken(fullname, txId); // Tạo token cho người dùng

        // Lấy danh sách tất cả các tổ chức từ 'datahospital'
        const hospitalKey = 'datahospital';
        const hospitalTokensBuffer = await ctx.stub.getState(hospitalKey);

        if (!hospitalTokensBuffer || hospitalTokensBuffer.length === 0) {
            throw new Error('No organizations found in the system');
        }

        const hospitalData = JSON.parse(hospitalTokensBuffer.toString());

        // Tìm thông tin tổ chức dựa vào tokeorg trong datahospital
        if (!hospitalData.includes(tokeorg)) {
            throw new Error(`Organization with token ${tokeorg} does not exist`);
        }

        // Lấy thông tin chi tiết tổ chức từ ledger
        const orgAsBytes = await ctx.stub.getState(tokeorg);
        if (!orgAsBytes || orgAsBytes.length === 0) {
            throw new Error(`Detailed organization data for token ${tokeorg} does not exist`);
        }

        const org = JSON.parse(orgAsBytes.toString());

        // Kiểm tra chi nhánh tồn tại
        const selectedBranch = org.hospitalbranch.find(item => item.tokenbranch === branch);
        if (!selectedBranch) {
            throw new Error(`Branch with token ${branch} does not exist in organization ${tokeorg}`);
        }

        // Kiểm tra và khởi tạo mảng nếu cần
        org.users = org.users || [];
        org.historyOrg = org.historyOrg || [];

        // Kiểm tra xem CCCD đã tồn tại chưa
        const existingUserWithCccd = org.users.find(user => user.cccd === cccd);
        if (existingUserWithCccd) {
            throw new Error(`User with CCCD ${cccd} already exists`);
        }

        // Tạo người dùng mới
        const newUser = {
            fullname,
            address,
            phone,
            typeusers,
            cccd,
            password,
            imgidentification,
            branch,  // Sử dụng tên chi nhánh từ thông tin chi nhánh tìm thấy
            timecreats,
            tokenuser,
            License,
            avatar,
            specialized,
            historyUser: []  // Khởi tạo lịch sử người dùng mới
        };

        // Thêm lịch sử cho người dùng mới
        newUser.historyUser.push({
            action: 'CREATE_USER',
            timestamp: timecreats,
            data: { fullname, address, phone, typeusers, cccd }
        });

        // Thêm người dùng mới vào danh sách người dùng của tổ chức
        org.users.push(newUser);

        // Thêm lịch sử cho tổ chức
        org.historyOrg.push({
            action: 'ADD_USER',
            timestamp: timecreats,
            data: { fullname, tokenuser }
        });

        // Lưu lại trạng thái của tổ chức
        await ctx.stub.putState(tokeorg, Buffer.from(JSON.stringify(org)));

        // In log kết quả thành công
        console.log(`User ${fullname} created in organization ${tokeorg} and branch ${branch}`);

        // Trả về token của người dùng mới tạo
        return tokenuser;

    } catch (error) {
        console.error(`Failed to create user: ${error.message}`);
        throw new Error(`Failed to create user: ${error.message}`);
    }
}

  
async getfullpersonnel(ctx, tokeorg) {
  // Lấy danh sách tổ chức
  const hospitalKey = 'datahospital';
  const hospitalTokensBuffer = await ctx.stub.getState(hospitalKey);

  if (!hospitalTokensBuffer || hospitalTokensBuffer.length === 0) {
      throw new Error('No organizations found in the system');
  }

  const hospitalTokens = JSON.parse(hospitalTokensBuffer.toString());

  // Kiểm tra tổ chức tồn tại
  if (!hospitalTokens.includes(tokeorg)) {
      throw new Error(`Organization with token ${tokeorg} does not exist`);
  }

  const orgAsBytes = await ctx.stub.getState(tokeorg);
  if (!orgAsBytes || orgAsBytes.length === 0) {
      throw new Error(`Organization with token ${tokeorg} does not exist`);
  }

  // Chuyển đổi dữ liệu từ bytes sang JSON
  const organization = JSON.parse(orgAsBytes.toString());

  // Kiểm tra nếu không có người dùng
  if (!organization.users || organization.users.length === 0) {
      throw new Error(`No users found in organization ${tokeorg}`);
  }

  // Trả về danh sách users của tổ chức
  return organization.users;
}

async updateOrganizationStatus(ctx, tokeorg, newStatus, currentTime) {
  // Lấy danh sách tổ chức
  const hospitalKey = 'datahospital';
  const hospitalTokensBuffer = await ctx.stub.getState(hospitalKey);

  if (!hospitalTokensBuffer || hospitalTokensBuffer.length === 0) {
      throw new Error('No organizations found in the system');
  }

  const hospitalTokens = JSON.parse(hospitalTokensBuffer.toString());

  // Kiểm tra tổ chức tồn tại
  if (!hospitalTokens.includes(tokeorg)) {
      throw new Error(`Organization with token ${tokeorg} does not exist`);
  }

  const orgAsBytes = await ctx.stub.getState(tokeorg);
  if (!orgAsBytes || orgAsBytes.length === 0) {
      throw new Error(`Organization with token ${tokeorg} does not exist`);
  }

  let org;
  try {
      org = JSON.parse(orgAsBytes.toString());
  } catch (error) {
      throw new Error(`Failed to parse organization data for token ${tokeorg}: ${error}`);
  }

  const currentStatus = org.statusOrg || "false";
  console.log(`Updating status of organization ${tokeorg} from ${currentStatus} to ${newStatus}`);

  org.statusOrg = newStatus;

  // Kiểm tra nếu `historyOrg` tồn tại, nếu không thì khởi tạo
  if (!org.historyOrg) {
      org.historyOrg = [];
  }

  org.historyOrg.push({
      action: 'UPDATE_STATUS',
      timestamp: currentTime,
      data: { previousStatus: currentStatus, newStatus }
  });

  try {
      await ctx.stub.putState(tokeorg, Buffer.from(JSON.stringify(org)));
  } catch (error) {
      throw new Error(`Failed to update organization status for token ${tokeorg}: ${error}`);
  }

  return {
      orgToken: tokeorg,
      org: org,
      status: newStatus,
      message: `Organization status updated successfully`
  };
}

async updateSyncOrganizationStatus(ctx, tokeorg, newStatus, currentTime) {
    // Lấy danh sách tổ chức
    const hospitalKey = 'datahospital';
    const hospitalTokensBuffer = await ctx.stub.getState(hospitalKey);
  
    if (!hospitalTokensBuffer || hospitalTokensBuffer.length === 0) {
        throw new Error('No organizations found in the system');
    }
  
    const hospitalTokens = JSON.parse(hospitalTokensBuffer.toString());
  
    // Kiểm tra tổ chức tồn tại
    if (!hospitalTokens.includes(tokeorg)) {
        throw new Error(`Organization with token ${tokeorg} does not exist`);
    }
  
    const orgAsBytes = await ctx.stub.getState(tokeorg);
    if (!orgAsBytes || orgAsBytes.length === 0) {
        throw new Error(`Organization with token ${tokeorg} does not exist`);
    }
  
    let org;
    try {
        org = JSON.parse(orgAsBytes.toString());
    } catch (error) {
        throw new Error(`Failed to parse organization data for token ${tokeorg}: ${error}`);
    }
  
    const currentStatus = org.statusOrg || "false";
    console.log(`Updating status of organization ${tokeorg} from ${currentStatus} to ${newStatus}`);
  
    org.Syncstatus = newStatus;
  
    // Kiểm tra nếu `historyOrg` tồn tại, nếu không thì khởi tạo
    if (!org.historyOrg) {
        org.historyOrg = [];
    }
  
    org.historyOrg.push({
        action: 'UPDATE_STATUS',
        timestamp: currentTime,
        data: { previousStatus: currentStatus, newStatus }
    });
  
    try {
        await ctx.stub.putState(tokeorg, Buffer.from(JSON.stringify(org)));
    } catch (error) {
        throw new Error(`Failed to update organization status for token ${tokeorg}: ${error}`);
    }
  
    return {
        orgToken: tokeorg,
        org: org,
        status: newStatus,
        message: `Organization status updated successfully`
    };
  }
  // Cập nhật thông tin người dùng
  async updateUser(ctx, tokeorg, cccd, fullname, address, phone, typeusers, password) {
    // Lấy danh sách tổ chức
    const hospitalKey = 'datahospital';
    const hospitalTokensBuffer = await ctx.stub.getState(hospitalKey);

    if (!hospitalTokensBuffer || hospitalTokensBuffer.length === 0) {
        throw new Error('No organizations found in the system');
    }

    const hospitalTokens = JSON.parse(hospitalTokensBuffer.toString());

    // Kiểm tra tổ chức tồn tại
    if (!hospitalTokens.includes(tokeorg)) {
        throw new Error(`Organization with token ${tokeorg} does not exist`);
    }

    const orgAsBytes = await ctx.stub.getState(tokeorg);
    if (!orgAsBytes || orgAsBytes.length === 0) {
      throw new Error(`Organization with token ${tokeorg} does not exist`);
    }

    const org = JSON.parse(orgAsBytes.toString());

    const user = org.users.find(user => user.cccd === cccd);
    if (!user) {
      throw new Error(`User with cccd ${cccd} not found`);
    }

    // Cập nhật thông tin người dùng
    user.fullname = fullname;
    user.address = address;
    user.phone = phone;
    user.typeusers = typeusers;
    user.password = password;

    user.historyUser.push({
      action: 'UPDATE_USER',
      timestamp: new Date().toISOString(),
      updatedFields: { fullname, address, phone, typeusers, password }
    });

    await ctx.stub.putState(tokeorg, Buffer.from(JSON.stringify(org)));
    console.log(`User ${cccd} updated in organization ${tokeorg}`);
  }


  // Kiểm tra quyền admin
  async checkroleAdmin(ctx) {
    const clientMSPID = ctx.clientIdentity.getMSPID();

    if (clientMSPID === 'Org1MSP') {
      return true;
    } else {
      return false;
    }
  }

  // Thêm người dùng vào tổ chức
  
  async getUserByTokeorg(ctx, tokeorg, tokenuser) {
    // Lấy dữ liệu tổ chức từ ledger
    const orgAsBytes = await ctx.stub.getState(tokeorg);
    if (!orgAsBytes || orgAsBytes.length === 0) {
      throw new Error(`Organization with token ${tokeorg} does not exist`);
    }
  
    // Chuyển đổi dữ liệu từ bytes thành đối tượng
    const org = JSON.parse(orgAsBytes.toString());
  
    // Kiểm tra xem org là một mảng hay không
  
    // Tìm người dùng trong tổ chức dựa trên token

    const user = org.users.find(item => item.tokenuser === tokenuser);
    if (!user) {
      throw new Error('User does not exist in this organization');
    }
  
    // Trả về thông tin người dùng mà không thực hiện xác thực mật khẩu
    return user;
  }
  
  

  // Lấy thông tin tổ chức
  async getOrganization(ctx, tokeorg) {
    const hospitalKey = 'datahospital';

    // Lấy danh sách token từ state thông qua key 'datahospital'
    const hospitalTokensBuffer = await ctx.stub.getState(hospitalKey);
    
    if (!hospitalTokensBuffer || hospitalTokensBuffer.length === 0) {
        throw new Error('No hospital tokens found in the public state');
    }

    const hospitalTokens = JSON.parse(hospitalTokensBuffer.toString());

    // Kiểm tra xem token tổ chức có trong danh sách hospitalTokens không
    if (!hospitalTokens.includes(tokeorg)) {
        throw new Error(`Organization with token ${tokeorg} does not exist in the list of hospital tokens`);
    }

    // Lấy dữ liệu tổ chức từ state công khai
    const orgAsBytes = await ctx.stub.getState(tokeorg);
    
    // Kiểm tra xem dữ liệu có tồn tại không
    if (!orgAsBytes || orgAsBytes.length === 0) {
        throw new Error(`Organization with token ${tokeorg} does not exist in the public state`);
    }

    // Chuyển đổi dữ liệu từ bytes sang đối tượng JSON
    const org = JSON.parse(orgAsBytes.toString());

    // Trả về thông tin tổ chức
    const result = {
        nameorg: org.nameorg,
        nameadmin: org.nameadmin,
        emailadmin: org.emailadmin,
        addressadmin: org.addressadmin,
        phoneadmin: org.phoneadmin,
        businessBase64: org.businessBase64,
        tokeorg: org.tokeorg,
        statusOrg: org.statusOrg,
    };

    return result;
}



  // Kiểm tra tổ chức đã tồn tại chưa
  async organizationExists(ctx, tokeorg) {
    const orgAsBytes = await ctx.stub.getState(tokeorg);
    return orgAsBytes && orgAsBytes.length > 0;
  }

  // Lấy thông tin người dùng từ tổ chức
  async getinfoUser(ctx, tokeorg, cccd) {
    const orgAsBytes = await ctx.stub.getState(tokeorg);
    if (!orgAsBytes || orgAsBytes.length === 0) {
      throw new Error(`Organization with token ${tokeorg} does not exist`);
    }

    const org = JSON.parse(orgAsBytes.toString());

    const user = org.users.find(user => user.cccd === cccd);
    if (!user) {
      throw new Error(`User with cccd ${cccd} not found in organization ${tokeorg}`);
    }

    return user;
  }

// Lấy toàn bộ thông tin các tổ chức
async getAllOrganizations(ctx) {
  const iterator = await ctx.stub.getPrivateDataByRangeByRange('myPrivateCollection_Org1', '', '');
  
  // Log the iterator to check its structure
  console.log("Iterator: ", iterator);

  if (!iterator || typeof iterator.next !== 'function') {
    throw new Error("Iterator is not valid or not initialized properly.");
  }

  const allResults = [];
  
  let res = await iterator.next();
  while (!res.done) {
      const record = res.value;
      console.log("Record fetched: ", record); // Log record
      if (record.value) { // Check if value exists
          allResults.push(JSON.parse(record.value.toString('utf8')));
      }
      res = await iterator.next();
  }
  
  await iterator.close(); // Always close the iterator
  return allResults;
}


async getActiveHospitals(ctx) {
  const hospitalKey = 'datahospital';

  // Lấy danh sách token từ state thông qua key 'datahospital'
  const hospitalTokensBuffer = await ctx.stub.getState(hospitalKey);
  if (!hospitalTokensBuffer || hospitalTokensBuffer.length === 0) {
      return []; // Không có tổ chức nào
  }

  const hospitalTokens = JSON.parse(hospitalTokensBuffer.toString());
  const activeHospitals = []; // Mảng lưu trữ thông tin các bệnh viện có statusOrg là true

  // Lặp qua từng token và lấy dữ liệu tổ chức tương ứng từ state
  for (const token of hospitalTokens) {
      const orgDataBuffer = await ctx.stub.getState(token);
      if (orgDataBuffer && orgDataBuffer.length > 0) {
          const orgData = JSON.parse(orgDataBuffer.toString());
          
          // Kiểm tra xem statusOrg có phải là true không
          if (orgData.statusOrg === 'true') { // Đảm bảo so sánh đúng kiểu
              activeHospitals.push({
                  tokeorg: token,
                  nameorg: orgData.nameorg // Chỉ lấy tokeorg và nameorg
              });
          }
      }
  }

  return activeHospitals; // Trả về danh sách các bệnh viện hoạt động
}

async getFullDataHospital(ctx) {
  const hospitalKey = 'datahospital';

  // Lấy danh sách token từ state thông qua key 'datahospital'
  const hospitalTokensBuffer = await ctx.stub.getState(hospitalKey);
  if (!hospitalTokensBuffer || hospitalTokensBuffer.length === 0) {
      return []; // Không có tổ chức nào
  }

  const hospitalTokens = JSON.parse(hospitalTokensBuffer.toString());
  const organizations = [];

  // Lặp qua từng token và lấy dữ liệu tổ chức tương ứng từ state
  for (const token of hospitalTokens) {
      const orgDataBuffer = await ctx.stub.getState(token);
      if (orgDataBuffer && orgDataBuffer.length > 0) {
          const orgData = JSON.parse(orgDataBuffer.toString());
          organizations.push(orgData);
      }
  }

  return organizations; // Trả về danh sách tổ chức
}
async getOrganizationsWithStatusTrue(ctx) {
    const hospitalKey = 'datahospital';

    // Lấy danh sách token từ state thông qua key 'datahospital'
    const hospitalTokensBuffer = await ctx.stub.getState(hospitalKey);
    if (!hospitalTokensBuffer || hospitalTokensBuffer.length === 0) {
        return []; // Không có tổ chức nào
    }

    const hospitalTokens = JSON.parse(hospitalTokensBuffer.toString());
    const organizationsWithTrue = [];

    // Lặp qua từng token và lấy dữ liệu tổ chức tương ứng từ state
    for (const token of hospitalTokens) {
        const orgDataBuffer = await ctx.stub.getState(token);
        if (orgDataBuffer && orgDataBuffer.length > 0) {
            const orgData = JSON.parse(orgDataBuffer.toString());
            if (orgData.statusOrg === "true") {
                organizationsWithTrue.push(orgData);
            }
        }
    }

    return organizationsWithTrue; // Trả về danh sách tổ chức có statusOrg là "true"
}
async getOrganizationsWithStatusFalse(ctx) {
    const hospitalKey = 'datahospital';

    // Lấy danh sách token từ state thông qua key 'datahospital'
    const hospitalTokensBuffer = await ctx.stub.getState(hospitalKey);
    if (!hospitalTokensBuffer || hospitalTokensBuffer.length === 0) {
        return []; // Không có tổ chức nào
    }

    const hospitalTokens = JSON.parse(hospitalTokensBuffer.toString());
    const organizationsWithFalse = [];

    // Lặp qua từng token và lấy dữ liệu tổ chức tương ứng từ state
    for (const token of hospitalTokens) {
        const orgDataBuffer = await ctx.stub.getState(token);
        if (orgDataBuffer && orgDataBuffer.length > 0) {
            const orgData = JSON.parse(orgDataBuffer.toString());
            if (orgData.statusOrg === "false") {
                organizationsWithFalse.push(orgData);
            }
        }
    }

    return organizationsWithFalse; // Trả về danh sách tổ chức có statusOrg là "false"
}


  //   async getActiveOrganizations(ctx) {
  //     const queryString = {
  //         selector: {
  //             statusOrg: 'true'
  //         }
  //     };

  //     const resultsIterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
  //     const organizations = [];

  //     while (true) {
  //         const res = await resultsIterator.next();

  //         if (res.value && res.value.value.toString()) {
  //             const org = JSON.parse(res.value.value.toString('utf8'));
  //             organizations.push(org);
  //         }

  //         if (res.done) {
  //             await resultsIterator.close();
  //             break;
  //         }
  //     }

  //     return organizations;
  // }

  // Hàm băm dữ liệu để tạo token, sử dụng txID để đảm bảo tính định tính
  hasDataToken(data, txId) {
    const dataWithTxId = `${data}:${txId}`;
    const hash = crypto.createHash('sha256');
    hash.update(dataWithTxId);
    return hash.digest('hex');
  }
}

module.exports = OrgChaincode;
