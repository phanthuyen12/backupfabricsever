'use strict';

const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

class MedicalBookContract extends Contract {

    async initLedger(ctx) {
        console.info('Khởi tạo sổ cái với dữ liệu mẫu');

        const sampleRecords = [
            {
                cccd: '3924982758347',
                tokenmedical: 'P0sdfsljdfjk01',
                name: 'Nguyen Van A',
                email: 'phangiathuyendev@gmail.com',
                birthDate: '1980-01-01',
                gender: 'Nam',
                weight: 70,   // Thêm cân nặng
                height: 175,  // Thêm chiều cao
                address: '123 Main St, Hanoi',
                phoneNumber: '0901234567',
                avatar: '123456789',
                passwordmedical: 'matkhau123',  // Thêm mật khẩu bảo vệ hồ sơ y tế
                historyCode :[
                        {
                            verificationCode:"",
                            verificationExpiry:"",
                        }
                ],
                survivalIndex: [                // Thêm thông tin về chỉ số sinh tồn
                    {
                        bloodType: 'O+',         // Nhóm máu
                        heartRate: 75,           // Nhịp tim (bpm)
                        bloodPressure: '120/80'  // Huyết áp
                    }
                ],
                medicalinsurance: 'BH123456789', // Sổ bảo hiểm y tế
                medicalHistory: [               // Lịch sử y tế (có thể thêm nhiều mục)
                    {
                        date: '2023-01-01',
                        diagnosis: 'Cảm lạnh',
                        treatment: 'Nghỉ ngơi, uống thuốc hạ sốt'
                    }
                ],
                currentStatus: {                // Trạng thái hiện tại của bệnh nhân
                    symptoms: 'Đau đầu',
                    diagnosis: 'Tăng huyết áp',
                    treatmentPlan: 'Thuốc B'
                },
                medicalExaminationHistory: [     // Lịch sử khám bệnh của bệnh nhân
                    [
                       {
                        tokenmedicalExamination:'sdfsfsdfsdf',
                        date: '2023-05-01',
                        doctor: 'Bác sĩ B',
                        hospital: 'Bệnh viện Bạch Mai',
                        notes: 'Bệnh nhân ổn định, theo dõi huyết áp'
                       },
                       {
                        tokenmedicalExamination:'sdfsfsdfsdf',
                        date: '2023-05-01',
                        doctor: 'Bác sĩ B',
                        hospital: 'Bệnh viện Bạch Mai',
                        notes: 'Bệnh nhân ổn định, theo dõi huyết áp'
                       }
                    ]
                ],
                accessRequests: [],              // Danh sách yêu cầu quyền truy cập
                authorizedEntities: []           // Các thực thể được phê duyệt quyền truy cập
            }
        ];

        for (const record of sampleRecords) {
            await ctx.stub.putState(record.cccd, Buffer.from(JSON.stringify(record)));
            console.info(`Đã thêm bản ghi với ID: ${record.cccd}`);
        }
    }

    async forgotPassword(ctx, cccd, dataz,verificationCodez) {
        console.info(`Xử lý quên mật khẩu cho CCCD: ${cccd}`);
    
        // Lấy bản ghi y tế của bệnh nhân theo CCCD
        const userBuffer = await ctx.stub.getState(cccd);
        if (!userBuffer || userBuffer.length === 0) {
            console.error(`Không tìm thấy bệnh nhân với CCCD: ${cccd}`);
            return { success: false, message: `Không tìm thấy bệnh nhân với CCCD: ${cccd}` };
        }
    
        // Chuyển đổi từ Buffer sang JSON
        const user = JSON.parse(userBuffer.toString('utf8'));
    
        // Tạo mã xác nhận ngẫu nhiên

    
        // Kiểm tra và khởi tạo mảng historyCode nếu chưa tồn tại
        if (!Array.isArray(user.historyCode)) {
            user.historyCode = [];
        }
    
        // Thêm mã xác nhận và thời gian hết hạn vào historyCode
        user.historyCode.push({
            verificationCode: verificationCodez,
            verificationExpiry: dataz,
        });
    
        // Lưu lại bản ghi đã được cập nhật
        await ctx.stub.putState(cccd, Buffer.from(JSON.stringify(user)));
        console.info(`Đã lưu mã xác nhận cho CCCD: ${cccd}`);
    
        // Trả về kết quả
        return { success: true, verificationCode: verificationCodez,phone :user.phoneNumber};
    }
    async verifyAndChangePassword(ctx, cccd, verificationCode, newPassword,data) {
        console.info(`Xác nhận mã và đổi mật khẩu cho CCCD: ${cccd}`);
    
        // Lấy bản ghi y tế của bệnh nhân theo CCCD
        const userBuffer = await ctx.stub.getState(cccd);
        if (!userBuffer || userBuffer.length === 0) {
            console.error(`Không tìm thấy bệnh nhân với CCCD: ${cccd}`);
            return { success: false, message: `Không tìm thấy bệnh nhân với CCCD: ${cccd}` };
        }
    
        // Chuyển đổi từ Buffer sang JSON
        const user = JSON.parse(userBuffer.toString('utf8'));
    
        // Kiểm tra nếu mảng historyCode tồn tại và không rỗng
        if (!Array.isArray(user.historyCode) || user.historyCode.length === 0) {
            console.error(`Không tìm thấy mã xác minh cho CCCD: ${cccd}`);
            return { success: false, message: "Không tìm thấy mã xác minh." };
        }
    
        // Lấy mã xác nhận cuối cùng trong mảng historyCode
        const latestCode = user.historyCode[user.historyCode.length - 1];
    
        // Kiểm tra mã xác minh có hợp lệ không
        const currentTime = data;
        if (latestCode.verificationCode !== verificationCode) {
            console.error(`Mã xác minh không đúng cho CCCD: ${cccd}`);
            return { success: false, message: "Mã xác minh không đúng." };
        }
    
        // Kiểm tra thời gian hết hạn của mã xác minh
        if (new Date(latestCode.verificationExpiry) < currentTime) {
            console.error(`Mã xác minh đã hết hạn cho CCCD: ${cccd}`);
            return { success: false, message: "Mã xác minh đã hết hạn." };
        }
    
        // Cập nhật mật khẩu mới
        user.passwordmedical = newPassword;
    
        // Xóa mã xác minh đã sử dụng (nếu cần)
        user.historyCode = user.historyCode.filter(code => code.verificationCode !== verificationCode);
    
        // Lưu lại bản ghi đã được cập nhật
        await ctx.stub.putState(cccd, Buffer.from(JSON.stringify(user)));
        console.info(`Mật khẩu đã được cập nhật thành công cho CCCD: ${cccd}`);
    
        // Trả về kết quả
        return { success: true, message: "Mật khẩu đã được cập nhật thành công.",phone:user.phoneNumber };
    }
    
    async getAllMedicalRecords(ctx) {
        console.info('Lấy tất cả các sổ khám bệnh từ sổ cái');

        const iterator = await ctx.stub.getStateByRange('', ''); // Lấy toàn bộ dữ liệu trong range từ '' đến ''
        const allRecords = [];

        let result = await iterator.next();
        while (!result.done) {
            const recordKey = result.value.key;
            const recordValue = result.value.value.toString('utf8');

            // Parse dữ liệu JSON của bản ghi
            let record;
            try {
                record = JSON.parse(recordValue);
            } catch (err) {
                console.error(`Lỗi parse dữ liệu cho key: ${recordKey}`, err);
                record = recordValue;
            }

            allRecords.push({ Key: recordKey, Record: record });
            result = await iterator.next();
        }

        await iterator.close(); // Đảm bảo đóng iterator sau khi sử dụng

        console.info('Đã lấy xong tất cả các sổ khám bệnh.');
        return JSON.stringify(allRecords); // Trả về danh sách bản ghi dưới dạng chuỗi JSON
    }

    async createRecord(ctx, name, email, birthDate, gender, weight, height, address, phoneNumber, avatar, cccd, medicalinsurance, passwordmedical) {
        // Kiểm tra xem email đã tồn tại trong blockchain chưa
        const emailKey = `email_${email}`;
        const emailExists = await ctx.stub.getState(emailKey);
        if (emailExists.length !== 0) {
            throw new Error(`Email ${email} đã tồn tại trong hệ thống.`);
        }

        // Kiểm tra xem CCCD đã tồn tại trong blockchain chưa
        const cccdExists = await ctx.stub.getState(cccd);
        if (cccdExists.length !== 0) {
            throw new Error(`CCCD ${cccd} đã tồn tại trong hệ thống.`);
        }

        // Tạo token y tế (một mã định danh duy nhất) cho bệnh án
        const tokenmedical = this.generateToken(name);

        // Tạo một đối tượng bệnh án với các thông tin cơ bản
        const record = {
            tokenmedical,
            name,
            email,
            birthDate,
            gender,
            weight,
            height,
            address,
            phoneNumber,
            avatar,
            cccd,
            passwordmedical,
            survivalIndex: [],
            medicalinsurance,
            medicalHistory: [],
            currentStatus: {},
            medicalExaminationHistory: [],
            accessRequests: [],
            authorizedEntities: []
        };

        // Thêm sự kiện "TẠO_MEDICAL" vào lịch sử y tế
        const currentTime = new Date().toISOString();
        record.medicalHistory.push({
            action: 'CREAT_MEDICAL',
            timestamp: currentTime,
            data: { name, birthDate, gender, address, phoneNumber, avatar, cccd, passwordmedical }
        });

        // Hiển thị thông tin đã tạo bệnh án với mã CCCD
        console.info(`Đã tạo bản ghi với CCCD: ${cccd}`);

        // Lưu bệnh án vào blockchain sử dụng CCCD làm khóa
        await ctx.stub.putState(cccd, Buffer.from(JSON.stringify(record)));

        // Lưu email vào blockchain để kiểm tra sau này
        await ctx.stub.putState(emailKey, Buffer.from(cccd)); // Lưu CCCD liên kết với email

        // Trả về mã CCCD sau khi tạo thành công
        return cccd;
    }

async getDataFunaccessRequests(ctx, cccd,tokenmedical) {
    const hospitalKey = 'medicalRecords';
    let existingRecordsBuffer = await ctx.stub.getState(hospitalKey);
    let medicalRecords = [];

    if (existingRecordsBuffer && existingRecordsBuffer.length > 0) {
        medicalRecords = JSON.parse(existingRecordsBuffer.toString('utf8'));
    }

    // Tìm bản ghi cụ thể dựa trên CCCD
    const record = medicalRecords.find(record => record.cccd === cccd);

    if (!record) {
        return {
            success: false,
            message: `Không tìm thấy bản ghi với CCCD ${cccd}`
        };
    }

    // Kiểm tra token trong bản ghi
    if (record.tokenmedical !== tokenmedical) {
        return {
            success: false,
            message: 'Token không hợp lệ.'
        };
    }

    return {
        success: true,
        message: 'Bản ghi đã được lấy thành công.',
        record: record.accessRequests
    };
}

    async loginMedical(ctx, cccd, passwordmedical) {
        // Lấy tất cả hồ sơ y tế
        const allRecords = await this.getAllMedicalRecords(ctx);
        const parsedRecords = JSON.parse(allRecords);

        // Tìm hồ sơ dựa trên cccd
        const existingRecord = parsedRecords.find(record =>
            record.Record.cccd === cccd
        );

        if (!existingRecord) {
            return { success: false, message: 'CCCD không tồn tại trong hệ thống.' };
        }

        // Kiểm tra mật khẩu (được bỏ ra ở phiên bản trước)
        // const passwordMatch = await bcrypt.compare(passwordmedical, existingRecord.Record.passwordmedical);
        // if (!passwordMatch) {
        //     return { success: false, message: 'Mật khẩu không chính xác.' };
        // }

        // Tạo JWT token (được bỏ ra ở phiên bản trước)
        // const payload = {
        //     tokenmedical: existingRecord.Record.tokenmedical,
        //     name: existingRecord.Record.name,
        //     email: existingRecord.Record.email,
        //     cccd: existingRecord.Record.cccd
        // };

        // const secretKey = 'ee2de3938caccb365423140f03873e7b3f2032696632c594131835fe88db55f76f5580f678835c22b578de32cc7ec35d9f0a42a65dec98a839625b5611296e70'; // Thay thế với khóa bí mật của bạn
        // const token = jwt.sign(payload, secretKey, { expiresIn: '1h' }); // Token hết hạn sau 1 giờ

        console.info(`Người dùng với CCCD ${cccd} đã đăng nhập thành công.`);
        return {
            success: true,
            message: 'Đăng nhập thành công.',
            existingRecord: existingRecord.Record // Trả về thông tin hồ sơ y tế
        };  // Trả về thông tin thành công sau khi đăng nhập thành công
    }
    async countTotalExaminations(ctx) {
        const hospitalKey = 'medicalRecords'; // Key chứa danh sách tất cả các bản ghi y tế
        const recordsBuffer = await ctx.stub.getState(hospitalKey);
    
        // Kiểm tra nếu không tìm thấy bản ghi y tế nào
        if (!recordsBuffer || recordsBuffer.length === 0) {
            return 0; // Không có bản ghi y tế nào, trả về 0
        }
    
        const medicalRecords = JSON.parse(recordsBuffer.toString('utf8'));
        let totalExaminations = 0;
    
        for (const record of medicalRecords) {
            // Lấy danh sách khám bệnh từ mỗi bản ghi
            if (record.examinationhistory && Array.isArray(record.examinationhistory)) {
                totalExaminations += record.examinationhistory.length;
            }
        }
    
        return totalExaminations; // Trả về tổng số khám bệnh
    }
    
    async registerMedical(ctx, name, email, cccd, passwordmedical, currentTime) {
        // Kiểm tra xem email hoặc CCCD đã tồn tại trong sổ cái chưa
        const existingRecord = await this.findExistingRecord(ctx, email, cccd);
        if (existingRecord.success === false) {
            return { success: false, message: existingRecord.message };
        }
        // return existingRecord

        const tokenmedical = this.generateToken(name);

        // Tạo một bản ghi y tế mới với thông tin cần thiết
        const medicalRecord = {
            name,
            email,
            cccd,
            passwordmedical,
          
            medicalHistory: [],
            currentStatus: {},
            accessRequests: [],
            examinationhistory:[],
            authorizedEntities: [],
            tokenmedical,
            timestamp: currentTime
        };

        // Thêm sự kiện "CREATE_MEDICAL" vào lịch sử y tế
        medicalRecord.medicalHistory.push({
            action: 'CREATE_MEDICAL',
            timestamp: currentTime,
            data: { name, email, cccd }
        });
        try {
            // Lưu bản ghi vào sổ cái blockchain dưới key CCCD
            await ctx.stub.putState(cccd, Buffer.from(JSON.stringify(medicalRecord)));

            // Lưu tất cả các bản ghi khám bệnh vào một key công khai
            const hospitalKey = 'medicalRecords';
            let existingRecordsBuffer = await ctx.stub.getState(hospitalKey);
            let medicalRecords = [];

            if (existingRecordsBuffer && existingRecordsBuffer.length > 0) {
                medicalRecords = JSON.parse(existingRecordsBuffer.toString('utf8'));
            }

            // Thêm bản ghi y tế mới vào mảng
            medicalRecords.push(medicalRecord);

            // Lưu tất cả bản ghi y tế vào blockchain dưới key 'medicalRecords'
            await ctx.stub.putState(hospitalKey, Buffer.from(JSON.stringify(medicalRecords)));

            console.info(`Đã tạo bản ghi y tế cho bệnh nhân với CCCD: ${cccd}`);
            return { success: true, message: `Bản ghi y tế đã được tạo với CCCD: ${existingRecord}` };
        } catch (error) {
            console.error(`Lỗi khi lưu bản ghi y tế: ${error}`);
            return { success: false, message: `Có lỗi xảy ra: ${error.message}` };
        }

    }
    async findExistingRecord(ctx, email, cccd) {
        const hospitalKey = 'medicalRecords';
        let existingRecordsBuffer = await ctx.stub.getState(hospitalKey);
        let medicalRecords = [];

        if (existingRecordsBuffer && existingRecordsBuffer.length > 0) {
            medicalRecords = JSON.parse(existingRecordsBuffer.toString('utf8'));

            for (const record of medicalRecords) {
                if (record.email === email) {
                    console.log(`Trùng lặp email: ${email}`);
                    return { success: false, message: `Email ${email} đã tồn tại trong hệ thống.` };
                }
                if (record.cccd === cccd) {
                    console.log(`Trùng lặp CCCD: ${cccd}`);
                    return { success: false, message: `CCCD ${cccd} đã tồn tại trong hệ thống.` };
                }
            }
        }

        return { success: true }; // Không có bản ghi nào tồn tại
    }
    async getMedicalHistory(ctx, cccd, tokenMedical) {
        try {
            // Lấy tất cả các bản ghi từ khóa 'medicalRecords'
            const hospitalKey = 'medicalRecords';
            let existingRecordsBuffer = await ctx.stub.getState(hospitalKey);
            let medicalRecords = [];
    
            if (existingRecordsBuffer && existingRecordsBuffer.length > 0) {
                medicalRecords = JSON.parse(existingRecordsBuffer.toString('utf8'));
    
                // Tìm bản ghi y tế dựa trên CCCD và tokenMedical
                const medicalRecord = medicalRecords.find(record => 
                    record.cccd === cccd && record.tokenmedical === tokenMedical
                );
    
                if (!medicalRecord) {
                    return { success: false, message: 'Không tìm thấy bản ghi y tế cho CCCD hoặc token này.' };
                }
    
                // Chuyển đổi accessRequests thành mảng nếu cần thiết
                const accessRequests = Array.isArray(medicalRecord.accessRequests) 
                    ? medicalRecord.accessRequests 
                    : [medicalRecord.accessRequests];
    
                // Trả về thông tin medicalHistory
                return { success: true, accessRequests };
            } else {
                return { success: false, message: 'Không tìm thấy bản ghi y tế nào trong hệ thống.' };
            }
        } catch (error) {
            console.error(`Lỗi khi lấy thông tin medicalHistory: ${error}`);
            return { success: false, message: `Có lỗi xảy ra: ${error.message}` };
        }
    }
    
    async checkRecordInfo(ctx, email, cccd) {
        // Lấy tất cả hồ sơ y tế
        const hospitalKey = 'medicalRecords';
        let existingRecordsBuffer = await ctx.stub.getState(hospitalKey);
        let medicalRecords = [];

        if (existingRecordsBuffer && existingRecordsBuffer.length > 0) {
            medicalRecords = JSON.parse(existingRecordsBuffer.toString('utf8'));
        }

        // Tìm bản ghi cụ thể dựa trên CCCD
        const record = medicalRecords.find(record => record.cccd === cccd);

        if (!record) {
            return {
                success: false,
                message: `Không tìm thấy bản ghi với CCCD ${cccd}`
            };
        }

        // Kiểm tra token trong bản ghi
        if (record.email !== email) {
            return {
                success: false,
                message: 'Token không hợp lệ.'
            };
        }

        return {
            success: true,
            message: 'Bản ghi đã được lấy thành công.',
            record: {
                email:record.email,
                cccd:record.cccd,
                medicalinsurance:record.medicalinsurance,
                gender:record.gender,
                address:record.gender,
            }
        };
        
    }




    async PostDataMedicalExaminationHistory(ctx, cccd, tokeorg, newData, timepost) {
        // Lấy tất cả các bản ghi khám bệnh từ hospitalKey
        const hospitalKey = 'medicalRecords';
        let existingRecordsBuffer = await ctx.stub.getState(hospitalKey);
        let medicalRecords = [];

        if (existingRecordsBuffer && existingRecordsBuffer.length > 0) {
            medicalRecords = JSON.parse(existingRecordsBuffer.toString('utf8'));
        }

        // Tìm bản ghi cụ thể dựa trên CCCD
        const recordIndex = medicalRecords.findIndex(record => record.cccd === cccd);
        if (recordIndex === -1) {
            return { success: false, message: `Record with CCCD ${cccd} does not exist` };
        }

        const record = medicalRecords[recordIndex];

        // Kiểm tra yêu cầu truy cập đã được phê duyệt chưa
        const approvedRequest = record.accessRequests.find(req => req.organization === tokeorg && req.approved === "true");
        if (!approvedRequest) {
            return { success: false, message: `Access request from organization ${ctx.clientIdentity.getMSPID()} is not approved.` };
        }

        // Cập nhật dữ liệu mới vào bản ghi
        Object.assign(record, newData);

        // Thêm thông tin lịch sử khám bệnh
        record.medicalHistory.push({
            action: "Add medical examination data",
            timestamp: timepost,
            data: newData
        });

        // Cập nhật lại bản ghi trong danh sách medicalRecords
        medicalRecords[recordIndex] = record;

        // Lưu tất cả bản ghi y tế vào blockchain dưới key 'medicalRecords'
        await ctx.stub.putState(hospitalKey, Buffer.from(JSON.stringify(medicalRecords)));

        console.info(`Record with CCCD ${cccd} has been successfully updated`);
        return { success: true, message: `Record with CCCD ${cccd} has been successfully updated` };
    }



    async updateRecord(ctx, cccd, weight, height, medicalinsurance, birthDate, gender, address, phoneNumber, avatar, currentTime) {
        // Lấy tất cả các bản ghi khám bệnh từ hospitalKey
        const hospitalKey = 'medicalRecords';
        let existingRecordsBuffer = await ctx.stub.getState(hospitalKey);
        let medicalRecords = [];

        if (existingRecordsBuffer && existingRecordsBuffer.length > 0) {
            medicalRecords = JSON.parse(existingRecordsBuffer.toString('utf8'));
        }

        // Tìm bản ghi cụ thể dựa trên CCCD
        const recordIndex = medicalRecords.findIndex(record => record.cccd === cccd);
        if (recordIndex === -1) {
            return { success: false, message: `Record with CCCD ${cccd} does not exist` };
        }

        // Cập nhật các trường với giá trị mới
        const record = medicalRecords[recordIndex];
        Object.assign(record, {
            weight,
            height,
            medicalinsurance,
            birthDate,
            gender,
            address,
            phoneNumber,
            avatar,
            
        });

        // Thêm sự kiện "UPDATE_MEDICAL" vào lịch sử y tế
        record.medicalHistory.push({
            action: 'UPDATE_MEDICAL',
            timestamp: currentTime,
            data: {
                weight,
                height,
                medicalinsurance,
                birthDate,
                gender,
                address,
                phoneNumber,
                avatar
            }
        });

        // Lưu bản ghi đã cập nhật vào sổ cái blockchain
        await ctx.stub.putState(cccd, Buffer.from(JSON.stringify(record)));

        // Cập nhật bản ghi trong danh sách medicalRecords
        medicalRecords[recordIndex] = record;

        // Lưu tất cả bản ghi y tế vào blockchain dưới key 'medicalRecords'
        await ctx.stub.putState(hospitalKey, Buffer.from(JSON.stringify(medicalRecords)));

        console.info(`Record with CCCD ${cccd} has been updated.`);

        return { success: true, message: `Record with CCCD ${cccd} has been successfully updated.` };
    }


    async requestAccess(ctx, cccd, tokeorg, tokenbranch, content, timerequest) {
        const hospitalKey = 'medicalRecords';
        let existingRecordsBuffer = await ctx.stub.getState(hospitalKey);
        let medicalRecords = [];
    
        if (existingRecordsBuffer && existingRecordsBuffer.length > 0) {
            medicalRecords = JSON.parse(existingRecordsBuffer.toString('utf8'));
        } else {
            return { success: false, message: "Không tìm thấy bản ghi y tế nào." };
        }
    
        const record = medicalRecords.find(rec => rec.cccd === cccd);
        if (!record) {
            return { success: false, message: `Bản ghi với CCCD ${cccd} không tồn tại` };
        }
    
        const clientMSPID = ctx.clientIdentity.getMSPID();
        const existingRequest = record.accessRequests.find(req => req.tokeorg === tokeorg);
    
        if (existingRequest) {
            // Kiểm tra xem nội dung có giống nhau không
            if (existingRequest.content === content) {
                return { success: false, message: `Tổ chức ${tokeorg} đã gửi yêu cầu quyền truy cập với nội dung này trước đó.` };
            } else {
                // Cập nhật nội dung nếu cần
                existingRequest.content = content;
            }
        } else {
            // Tạo yêu cầu mới nếu không tồn tại
            const newRequest = {
                tokeorg: tokeorg,
                tokenbranch: tokenbranch,
                nameorganization: clientMSPID,
                content: content,
                approved: false,
                viewType: "None",
                timestamp: timerequest, // Thêm dấu phẩy ở đây
                fieldsToShare: [] // Danh sách các trường sẽ chia sẻ (ban đầu rỗng)
            };
    
            // Thêm yêu cầu quyền truy cập mới vào danh sách yêu cầu
            record.accessRequests.push(newRequest);
        }
    
        // Cập nhật lịch sử y tế với yêu cầu mới
        record.medicalHistory.push({
            action: 'Receive requests from the organization',
            timestamp: timerequest,
            content: content,
            viewType: "None",
            data: { tokeorg, clientMSPID }
        });
    
        await ctx.stub.putState(hospitalKey, Buffer.from(JSON.stringify(medicalRecords)));
    
        console.info(`Tổ chức ${tokeorg} đã gửi yêu cầu quyền truy cập cho bản ghi với ID: ${cccd}`);
        return { success: true, message: `Yêu cầu quyền truy cập từ tổ chức ${tokeorg} đã được thêm vào bản ghi với ID: ${cccd}` };
    }
    
    async viewDataByTokenOrg(ctx, cccd, tokeorg, tokenbranch) {
        const hospitalKey = 'medicalRecords';
        let existingRecordsBuffer = await ctx.stub.getState(hospitalKey);
        let medicalRecords = [];
    
        if (existingRecordsBuffer && existingRecordsBuffer.length > 0) {
            medicalRecords = JSON.parse(existingRecordsBuffer.toString('utf8'));
        } else {
            return { success: false, message: "Không tìm thấy bản ghi y tế nào." };
        }
    
        const record = medicalRecords.find(rec => rec.cccd === cccd);
        if (!record) {
            return { success: false, message: `Bản ghi với CCCD ${cccd} không tồn tại` };
        }
    
        // Kiểm tra xem tổ chức và nhánh có quyền truy cập không
        const accessRequest = record.accessRequests.find(req => req.tokenbranch === tokenbranch);
        if (!accessRequest || !accessRequest.approved) {
            return { success: false, message: `Tổ chức ${tokeorg} không có quyền truy cập vào dữ liệu của bệnh nhân ${cccd}.` };
        }
    
        // Tạo một đối tượng mới để lưu trữ dữ liệu được chia sẻ
        let sharedData = {};
    
        // Duyệt qua các trường trong fieldsToShare và lấy giá trị từ bản ghi
        for (const field of accessRequest.fieldsToShare) {
            if (record[field] !== undefined) {
                sharedData[field] = record[field];
            }
        }
    
        // Nếu quyền truy cập được phê duyệt, trả về dữ liệu được chia sẻ
        return {
            success: true,
            data: {
                weight:record.weight,
                height:record.height,
                medicalinsurance:record.medicalinsurance,
                birthDate:record.birthDate,
                gender:record.gender,
                address:record.address,
                phoneNumber:record.phoneNumber,
                avatar:record.avatar,
                name:record.name,
                email:record.email,
                cccd:record.cccd,                
                fieldsToShare: accessRequest.fieldsToShare // Dữ liệu được chia sẻ
            }
        };
    }
    
   
    
    async approveAccessRequest(ctx, cccd, tokeorg, tokenbranch, fieldsToShare, currentTime) {
        const hospitalKey = 'medicalRecords';
        let existingRecordsBuffer = await ctx.stub.getState(hospitalKey);
        let medicalRecords = [];
    
        if (existingRecordsBuffer && existingRecordsBuffer.length > 0) {
            medicalRecords = JSON.parse(existingRecordsBuffer.toString('utf8'));
        } else {
            return { success: false, message: "Không tìm thấy bản ghi y tế nào." };
        }
    
        const record = medicalRecords.find(rec => rec.cccd === cccd);
        if (!record) {
            return { success: false, message: `Bản ghi với CCCD ${cccd} không tồn tại` };
        }
    
        const accessRequest = record.accessRequests.find(req => req.tokenbranch === tokenbranch);
        if (!accessRequest) {
            return { success: false, message: `Yêu cầu truy cập từ tổ chức ${tokenbranch} không tồn tại` };
        }
    
        accessRequest.approved = true;
    
        // Chuyển đổi fieldsToShare nếu không phải là mảng
        if (typeof fieldsToShare === 'string') {
            fieldsToShare = [fieldsToShare]; // Chuyển đổi chuỗi thành mảng
        } else if (!Array.isArray(fieldsToShare)) {
            return { success: false, message: "fieldsToShare phải là một mảng hoặc chuỗi." };
        }
    
        accessRequest.fieldsToShare = fieldsToShare; // Cập nhật các trường thông tin được chia sẻ
        // 'fullname' => 'required',
        // 'birthday' => 'required|date',
        // 'address' => 'required',
        // 'tokenmedical' => 'required',
        // 'sobh' => 'required',
        // 'sex' => 'required',
        // 'weight' => 'required',
        // 'height' => 'required',
        // 'email' => 'required',
        // 'phoneNumber' => 'required',
        // 'avatar' => 'required',
        // 'cccd' => 'required',
        record.medicalHistory.push({
            action: 'Approve access request',
            timestamp: currentTime,
            tokeorg: tokeorg,
            content: `Yêu cầu truy cập từ tổ chức ${tokenbranch} đã được phê duyệt. Thông tin chia sẻ: ${JSON.stringify(fieldsToShare)}`,
            viewType: "Approved",
            data: { tokenbranch },
         
        });
    
        await ctx.stub.putState(hospitalKey, Buffer.from(JSON.stringify(medicalRecords)));
    
        return { success: true, message: `Yêu cầu truy cập từ tổ chức ${tokenbranch} đã được phê duyệt.` };
    }
    
    
    async hasAccess(ctx, tokenmedical, tokenorg) {
        // Lấy bản ghi từ sổ cái
        const recordAsBytes = await ctx.stub.getState(tokenmedical);

        if (!recordAsBytes || recordAsBytes.length === 0) {
            throw new Error(`Bản ghi với ID ${tokenmedical} không tồn tại`);
        }

        const record = JSON.parse(recordAsBytes.toString());

        // Tìm yêu cầu quyền truy cập từ tổ chức cụ thể và kiểm tra trạng thái phê duyệt
        const accessRequest = record.accessRequests.find(request =>
            request.organization === tokenorg && request.approved === true
        );

        // Kiểm tra xem tổ chức có quyền truy cập hay không
        if (accessRequest) {
            console.info(`Tổ chức ${tokenorg} có quyền truy cập vào bản ghi với ID ${tokenmedical}`);
            return {
                tokenmedical: record.tokenmedical,
                name: record.name,
                birthDate: record.birthDate,
                gender: record.gender,
                address: record.address,
                phoneNumber: record.phoneNumber,
                avatar: record.avatar,

                cccd: record.cccd
            };
        } else {
            console.info(`Tổ chức ${tokenorg} không có quyền truy cập vào bản ghi với ID ${tokenmedical}`);
            return false;
        }
    }

    async getDataRecord(ctx, cccd, tokenmedical) {
        // Lấy tất cả các bản ghi khám bệnh từ hospitalKey
        const hospitalKey = 'medicalRecords';
        let existingRecordsBuffer = await ctx.stub.getState(hospitalKey);
        let medicalRecords = [];

        if (existingRecordsBuffer && existingRecordsBuffer.length > 0) {
            medicalRecords = JSON.parse(existingRecordsBuffer.toString('utf8'));
        }

        // Tìm bản ghi cụ thể dựa trên CCCD
        const record = medicalRecords.find(record => record.cccd === cccd);

        if (!record) {
            return {
                success: false,
                message: `Không tìm thấy bản ghi với CCCD ${cccd}`
            };
        }

        // Kiểm tra token trong bản ghi
        if (record.tokenmedical !== tokenmedical) {
            return {
                success: false,
                message: 'Token không hợp lệ.'
            };
        }

        return {
            success: true,
            message: 'Bản ghi đã được lấy thành công.',
            record: record
        };
    }





    async getMedicalRecord(ctx, cccd, tokeorg) {
        // Lấy bản ghi từ sổ cái
        const recordAsBytes = await ctx.stub.getState(cccd);

        if (!recordAsBytes || recordAsBytes.length === 0) {
            return {
                success: false,
                message: `Bản ghi với ID ${cccd} không tồn tại`
            };
        }

        const record = JSON.parse(recordAsBytes.toString());
        const clientMSPID = ctx.clientIdentity.getMSPID();

        // Kiểm tra xem tổ chức có được phê duyệt quyền truy cập không thuyen
        if (!record.approvedOrgs[tokeorg]) {
            return {
                success: false,
                message: `Tổ chức ${tokeorg} chưa được phê duyệt quyền truy cập`
            };
        }

        // Xác định loại quyền truy cập
        const accessType = record.approvedOrgs[tokeorg];

        let result;

        // Nếu tổ chức được phê duyệt quyền xem tất cả thông tin
        if (accessType.viewAll) {
            result = {
                cccd: record.cccd,
                tokenmedical: record.tokenmedical,
                name: record.name,
                birthDate: record.birthDate,
                gender: record.gender,
                email: record.email,
                address: record.address,
                phoneNumber: record.phoneNumber,
                avatar: record.avatar,
                medicalRecords: record.medicalRecords,
                currentStatus: record.currentStatus,
                medicalHistory: record.medicalHistory,
                accessRequests: record.accessRequests
            };
        }
        // Nếu tổ chức chỉ được phê duyệt quyền xem thông tin hạn chế
        else if (accessType.viewLimited) {
            result = {
                cccd: record.cccd,
                tokenmedical: record.tokenmedical,
                name: record.name,
                birthDate: record.birthDate,
                gender: record.gender,
                email: record.email
            };
        } else {
            return {
                success: false,
                message: `Tổ chức ${tokeorg} không có quyền truy cập vào thông tin này`
            };
        }

        return {
            success: true,
            message: 'Truy cập bản ghi thành công.',
            data: result
        }; // Trả về thông tin bản ghi y tế
    }


    generateToken(data) {
        const hash = crypto.createHash('sha256');
        hash.update(data);
        return hash.digest('hex');
    }

    async getAllDiseaseCodes(ctx, cccd,tokenmedical) {
        const hospitalKey = 'medicalRecords';
        let existingRecordsBuffer = await ctx.stub.getState(hospitalKey);
    
        // Kiểm tra xem dữ liệu có tồn tại không
        if (!existingRecordsBuffer || existingRecordsBuffer.length === 0) {
            return JSON.stringify({ success: false, message: "No records found." });
        }
    
        let medicalRecords = JSON.parse(existingRecordsBuffer.toString('utf8'));
    
        // Tìm bản ghi cụ thể dựa trên CCCD
        const record = medicalRecords.find(rec => rec.cccd === cccd && rec.tokenmedical ===tokenmedical);
        if (!record) {
            return JSON.stringify({ success: false, message: `Record with CCCD ${cccd} does not exist` });
        }
    
        // Lấy toàn bộ diseasecode và namedisease từ examinationhistory
        const diseaseInfo = record.examinationhistory
            .filter(entry => entry.diseasecode && entry.namedisease) // Lọc các mục có cả diseasecode và namedisease
            .map(entry => ({ diseasecode: entry.diseasecode, namedisease: entry.namedisease })); // Lấy cả diseasecode và namedisease
    
        // Trả về danh sách diseasecode và namedisease dưới dạng chuỗi JSON
        return JSON.stringify({
            success: true,
            message: "Disease codes retrieved successfully.",
            diseaseInfo: diseaseInfo
        });
    }
    async getDiseaseCodeDetails(ctx, cccd, tokenmedical, diseasecode) {
        const hospitalKey = 'medicalRecords';
        let existingRecordsBuffer = await ctx.stub.getState(hospitalKey);
    
        // Kiểm tra xem dữ liệu có tồn tại không
        if (!existingRecordsBuffer || existingRecordsBuffer.length === 0) {
            return JSON.stringify({ success: false, message: "No records found." });
        }
    
        let medicalRecords = JSON.parse(existingRecordsBuffer.toString('utf8'));
    
        // Tìm bản ghi cụ thể dựa trên CCCD và tokenmedical
        const record = medicalRecords.find(rec => rec.cccd === cccd && rec.tokenmedical === tokenmedical);
        if (!record) {
            return JSON.stringify({ success: false, message: `Record with CCCD ${cccd} does not exist` });
        }
    
        // Tìm kiếm thông tin chi tiết của diseasecode trong examinationhistory
        const diseaseDetail = record.examinationhistory.find(entry => entry.diseasecode === diseasecode);
        if (!diseaseDetail) {
            return JSON.stringify({
                success: false,
                message: `Disease code ${diseasecode} does not exist for record with CCCD ${cccd}`
            });
        }
    
        // Trả về chi tiết diseasecode dưới dạng chuỗi JSON
        return JSON.stringify({
            success: true,
            message: "Disease code details retrieved successfully.",
            diseaseDetail: diseaseDetail
        });
    }
    
async pushData(ctx, cccd, tokeorg, tokenbranch, newData,diseasecodes,namedisease, timepost) {
    const hospitalKey = 'medicalRecords';
    let existingRecordsBuffer = await ctx.stub.getState(hospitalKey);
    let medicalRecords = [];

    // Kiểm tra và load dữ liệu hiện tại từ blockchain
    if (existingRecordsBuffer && existingRecordsBuffer.length > 0) {
        medicalRecords = JSON.parse(existingRecordsBuffer.toString('utf8'));
    }

    // Tìm bản ghi cụ thể dựa trên CCCD
    const recordIndex = medicalRecords.findIndex(record => record.cccd === cccd);
    if (recordIndex === -1) {
        return { success: false, message: `Record with CCCD ${cccd} does not exist` };
    }

    const record = medicalRecords[recordIndex];

    // Kiểm tra yêu cầu truy cập đã được phê duyệt
    const approvedRequest = record.accessRequests.find(req => req.tokeorg === tokeorg && req.approved === true && req.tokenbranch === tokenbranch);
    if (!approvedRequest) {
        return { success: false, message: `Access request from organization ${ctx.clientIdentity.getMSPID()} is not approved.` };
    }

    // Kiểm tra và khởi tạo mảng examinationhistory nếu chưa tồn tại
    if (!record.examinationhistory) {
        record.examinationhistory = [];
    }

    // Thêm thông tin lịch sử khám bệnh
    record.examinationhistory.push({
        diseasecode:diseasecodes,
        namedisease:namedisease,
        timestamp: timepost,
        data: newData,
    });

    // Cập nhật lại bản ghi trong danh sách medicalRecords
    medicalRecords[recordIndex] = record;

    // Lưu tất cả bản ghi y tế vào blockchain dưới key 'medicalRecords'
    await ctx.stub.putState(hospitalKey, Buffer.from(JSON.stringify(medicalRecords)));

    console.info(`Record with CCCD ${cccd} has been successfully updated`);
    return { success: true, message: `Record with CCCD ${cccd} has been successfully updated` };
}
async getFieldsToShare(ctx, cccd, tokeorg, tokenbranch) {
    const hospitalKey = 'medicalRecords';
    let existingRecordsBuffer = await ctx.stub.getState(hospitalKey);

    // Kiểm tra xem dữ liệu có tồn tại không
    if (!existingRecordsBuffer || existingRecordsBuffer.length === 0) {
        return JSON.stringify({ success: false, message: "No records found." });
    }

    let medicalRecords = JSON.parse(existingRecordsBuffer.toString('utf8'));

    // Tìm bản ghi cụ thể dựa trên CCCD
    const record = medicalRecords.find(rec => rec.cccd === cccd);
    if (!record) {
        return JSON.stringify({ success: false, message: `Record with CCCD ${cccd} does not exist` });
    }

    // Kiểm tra yêu cầu truy cập đã được phê duyệt
    const approvedRequest = record.accessRequests.find(req => 
        req.tokeorg === tokeorg && req.tokenbranch === tokenbranch && req.approved === true
    );
    if (!approvedRequest) {
        return JSON.stringify({ success: false, message: `Access request from organization ${tokeorg} and branch ${tokenbranch} is not approved.` });
    }

    // Lọc các fieldsToShare trong examinationhistory dựa vào accessRequests
    const fieldsToShare = approvedRequest.fieldsToShare;
    const sharedDiseaseInfo = record.examinationhistory
        .filter(entry => fieldsToShare.includes(entry.diseasecode)) // Chỉ lấy các bệnh mà tổ chức được phép xem
        .map(entry => ({
            diseasecode: entry.diseasecode,
            namedisease: entry.namedisease,
            timestamp: entry.timestamp
        })); // Trả về cả diseasecode, namedisease và timestamp để tham khảo

    return JSON.stringify({
        success: true,
        message: "Fields to share retrieved successfully.",
        sharedDiseaseInfo: sharedDiseaseInfo
    });
}
async getDiseaseDetailsByCode(ctx, cccd, tokeorg, tokenbranch, diseasecode) {
    const hospitalKey = 'medicalRecords';
    let existingRecordsBuffer = await ctx.stub.getState(hospitalKey);

    // Kiểm tra xem dữ liệu có tồn tại không
    if (!existingRecordsBuffer || existingRecordsBuffer.length === 0) {
        return JSON.stringify({ success: false, message: "No records found." });
    }

    let medicalRecords = JSON.parse(existingRecordsBuffer.toString('utf8'));

    // Tìm bản ghi cụ thể dựa trên CCCD
    const record = medicalRecords.find(rec => rec.cccd === cccd);
    if (!record) {
        return JSON.stringify({ success: false, message: `Record with CCCD ${cccd} does not exist` });
    }

    // Kiểm tra yêu cầu truy cập đã được phê duyệt
    const approvedRequest = record.accessRequests.find(req => 
        req.tokeorg === tokeorg && req.tokenbranch === tokenbranch && req.approved === true
    );
    if (!approvedRequest) {
        return JSON.stringify({ success: false, message: `Access request from organization ${tokeorg} and branch ${tokenbranch} is not approved.` });
    }

    // Kiểm tra xem tổ chức có quyền truy cập vào diseasecode này không
    const fieldsToShare = approvedRequest.fieldsToShare;

    // Chuyển đổi từng mục trong fieldsToShare thành đối tượng và kiểm tra sự tồn tại của diseasecode
    let hasAccess = fieldsToShare.some((field) => {
        try {
            const fieldObj = JSON.parse(field); // Parse JSON string
            return Object.keys(fieldObj).includes(diseasecode); // Kiểm tra nếu diseasecode nằm trong các keys
        } catch (e) {
            return false; // Nếu parse thất bại, bỏ qua mục này
        }
    });

    if (!hasAccess) {
        return JSON.stringify({ success: false, message: `Access to disease code ${diseasecode} is not permitted for this organization.` });
    }

    // Lấy chi tiết bệnh với diseasecode cụ thể từ examinationhistory
    const diseaseDetail = record.examinationhistory.find(entry => entry.diseasecode === diseasecode);
    if (!diseaseDetail) {
        return JSON.stringify({ success: false, message: `No details found for disease code ${diseasecode}.` });
    }

    // Trả về chi tiết bệnh
    return JSON.stringify({
        success: true,
        message: "Disease details retrieved successfully.",
        diseaseDetail: {
            diseasecode: diseaseDetail.diseasecode,
            namedisease: diseaseDetail.namedisease,
            timestamp: diseaseDetail.timestamp,
            data: diseaseDetail.data // thêm các trường khác nếu có
        }
    });
}

}



module.exports = MedicalBookContract;
