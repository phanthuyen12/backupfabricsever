const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');

class NetworkManagent extends Contract {

    // Khởi tạo ledger với dữ liệu mẫu
    async initLedger(ctx) {
        const organizations = [{
            tokeorg: 'org-token-001',
            adminchangehistory: [] // Khởi tạo mảng adminchangehistory rỗng
        }];

        // Lưu tất cả tổ chức vào state
        for (let i = 0; i < organizations.length; i++) {
            const org = organizations[i];
            const publicOrg = {
                tokeorg: org.tokeorg,
                adminchangehistory: org.adminchangehistory,
            };
            await ctx.stub.putState(org.tokeorg, Buffer.from(JSON.stringify(publicOrg)));
            console.log('Added organization:', publicOrg);
        }
    }
    async UpdateAdminChangeRequestStatus(ctx, tokeorg, requestId, newStatus) {
        let orgAsBytes = await ctx.stub.getState(tokeorg);
        let org;
    
        if (!orgAsBytes || orgAsBytes.length === 0) {
            // Nếu tổ chức không tồn tại
            console.error(`Organization with token ${tokeorg} does not exist.`);
            return {
                message: `Organization with token ${tokeorg} does not exist.`,
                status: false // Trả về status là false khi không tìm thấy tổ chức
            };
        }
    
        // Parse dữ liệu tổ chức nếu đã tồn tại
        try {
            org = JSON.parse(orgAsBytes.toString());
            console.log('Existing organization found:', org);
        } catch (err) {
            console.error('Error parsing organization data:', err);
            return {
                message: 'Invalid data format in ledger for organization.',
                status: false // Trả về status là false nếu lỗi khi parsing dữ liệu
            };
        }
    
        // Tìm yêu cầu thay đổi admin trong lịch sử của tổ chức
        const changeRequest = org.adminchangehistory.find(request => request.requestId === requestId);
    
        if (!changeRequest) {
            // Nếu không tìm thấy yêu cầu, trả về lỗi
            console.error(`Change request with requestId ${requestId} not found.`);
            return {
                message: `Change request with requestId ${requestId} not found.`,
                status: false // Trả về status là false khi không tìm thấy yêu cầu
            };
        }
    
        // Cập nhật status của yêu cầu thay đổi admin thành trạng thái mới
        changeRequest.status = newStatus; // Cập nhật trạng thái với giá trị newStatus truyền vào
    
        // Cập nhật lại tổ chức vào ledger với lịch sử đã được thay đổi
        await ctx.stub.putState(tokeorg, Buffer.from(JSON.stringify(org)));
    
        console.log(`Change admin request status updated successfully: ${JSON.stringify(changeRequest)}`);
    
        // Trả về phản hồi với status là true nếu thành công
        return {
            message: `Admin change request with requestId ${requestId} updated to status ${newStatus} successfully.`,
            requestId,
            status: true // Trả về status là true khi cập nhật thành công
        };
    }
    
    // Yêu cầu thay đổi admin cho tổ chức
    async AddAdminChangeRequest(ctx, tokeorg, currentAdminToken, newAdminToken, reason, data,requestId,nameOrg,namenewAdminToken,namecurrentAdminToken) {
        // Lấy thông tin tổ chức từ ledger
        let orgAsBytes = await ctx.stub.getState(tokeorg);
        let org;
    
        if (!orgAsBytes || orgAsBytes.length === 0) {
            // Nếu tổ chức không tồn tại, tạo tổ chức mới
            org = {
                tokeorg,
                adminchangehistory: [],
            };
    
            console.log('New organization created:', org);
        } else {
            // Nếu tổ chức đã tồn tại, parse dữ liệu
            try {
                org = JSON.parse(orgAsBytes.toString());
                console.log('Existing organization found:', org);
            } catch (err) {
                console.error('Error parsing organization data:', err);
                throw new Error('Invalid data format in ledger for organization.');
            }
        }
    
        // Tạo ID duy nhất cho yêu cầu thay đổi admin
        // const requestId = crypto.randomBytes(16).toString('hex');
    
        // Tạo đối tượng yêu cầu thay đổi admin
        const changeRequest = {
            requestId,
            currentAdminToken,
            newAdminToken,
            nameOrg,
            namenewAdminToken,
            namecurrentAdminToken,
            status: 'PENDING', // Trạng thái ban đầu là đang chờ xử lý
            timestamp: data, // Dữ liệu timestamp từ tham số truyền vào
            reason, // Lý do thay đổi admin
        };
    
        // Thêm yêu cầu thay đổi admin vào lịch sử của tổ chức
        org.adminchangehistory.push(changeRequest);
    
        // Cập nhật tổ chức vào ledger
        await ctx.stub.putState(tokeorg, Buffer.from(JSON.stringify(org)));
    
        console.log(`Change admin request created successfully: ${JSON.stringify(changeRequest)}`);
    
        // Trả về phản hồi
        return { 
            message: 'Change admin request created successfully.', 
            requestId 
        };
    }
    
    // Lấy tất cả yêu cầu thay đổi admin từ lịch sử thay đổi admin
    async getAdminChangeHistory(ctx, tokeorg) {
        const orgAsBytes = await ctx.stub.getState(tokeorg);
        if (!orgAsBytes || orgAsBytes.length === 0) {
            throw new Error(`Organization with token ${tokeorg} does not exist`);
        }
    
        let org;
        try {
            org = JSON.parse(orgAsBytes.toString());
        } catch (error) {
            throw new Error(`Error parsing organization data for ${tokeorg}: ${error.message}`);
        }
    
        if (!org.adminchangehistory) {
            throw new Error(`No admin change history found for organization ${tokeorg}`);
        }
    
        return org.adminchangehistory;
    }
    
    async getAllAdminChangeHistories(ctx) {
        // Tạo một iterator để duyệt qua tất cả các key-value trong world state
        const iterator = await ctx.stub.getStateByRange('', '');
    
        const allHistories = []; // Mảng chứa lịch sử thay đổi admin của tất cả tổ chức
    
        let result = await iterator.next();
        while (!result.done) {
            const key = result.value.key; // Token tổ chức (key)
            const value = result.value.value.toString(); // Dữ liệu tổ chức (value)
    
            try {
                const org = JSON.parse(value); // Parse dữ liệu tổ chức
    
                // Kiểm tra nếu tổ chức có lịch sử thay đổi admin
                if (org.adminchangehistory && Array.isArray(org.adminchangehistory)) {
                    allHistories.push({
                        organizationToken: key,
                        adminChangeHistory: org.adminchangehistory,
                    });
                }
            } catch (err) {
                console.error(`Error parsing data for key ${key}:`, err);
            }
    
            result = await iterator.next(); // Lấy dữ liệu tiếp theo
        }
    
        await iterator.close(); // Đóng iterator
    
        // Trả về tất cả lịch sử thay đổi admin
        return allHistories;
    }
    
    // Cập nhật trạng thái yêu cầu thay đổi admin
    async updateAdminChangeStatus(ctx, tokeorg, requestId, status) {
        const orgAsBytes = await ctx.stub.getState(tokeorg);
        if (!orgAsBytes || orgAsBytes.length === 0) {
            throw new Error(`Organization with token ${tokeorg} does not exist`);
        }
    
        const org = JSON.parse(orgAsBytes.toString());
    
        // Kiểm tra trạng thái hợp lệ
        // if (!['PENDING', 'COMPLETED', 'REJECTED'].includes(status)) {
        //     throw new Error(`Invalid status: ${status}`);
        // }
    
        // // Tìm yêu cầu theo requestId và cập nhật trạng thái
        const request = org.adminchangehistory.find(req => req.requestId === requestId);
        if (!request) {
            throw new Error(`Request with ID ${requestId} not found`);
        }
    
        request.status = status;
   
        await ctx.stub.putState(tokeorg, Buffer.from(JSON.stringify(org)));
    
        // console.log(`Admin change request ${requestId} updated to status ${status}`);
        return true;
    }
    
}

module.exports = NetworkManagent;
