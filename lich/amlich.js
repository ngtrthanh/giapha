// Vietnamese Lunar Calendar Algorithm - based on Hồ Ngọc Đức
const TK19=[0x30baa3,0x56ab50,0x422ba0,0x2cab61,0x52a370,0x3c51e8,0x60d160,0x4ae4b0,0x376926,0x58daa0,0x445b50,0x3116d2,0x562ae0,0x3ea2e0,0x28e2d2,0x4ec950,0x38d556,0x5cb520,0x46b690,0x325da4,0x5855d0,0x4225d0,0x2ca5b3,0x52a2b0,0x3da8b7,0x60a950,0x4ab4a0,0x35b2a5,0x5aad50,0x4455b0,0x302b74,0x562570,0x4052f9,0x6452b0,0x4e6950,0x386d56,0x5e5aa0,0x46ab50,0x3256d4,0x584ae0,0x42a570,0x2d4553,0x50d2a0,0x3be8a7,0x60d550,0x4a5aa0,0x34ada5,0x5a95d0,0x464ae0,0x2eaab4,0x54a4d0,0x3ed2b8,0x64b290,0x4cb550,0x385757,0x5e2da0,0x4895d0,0x324d75,0x5849b0,0x42a4b0,0x2da4b3,0x506a90,0x3aad98,0x606b50,0x4c2b60,0x359365,0x5a9370,0x464970,0x306964,0x52e4a0,0x3cea6a,0x62da90,0x4e5ad0,0x392ad6,0x5e2ae0,0x4892e0,0x32cad5,0x56c950,0x40d4a0,0x2bd4a3,0x50b690,0x3a57a7,0x6055b0,0x4c25d0,0x3695b5,0x5a92b0,0x44a950,0x2ed954,0x54b4a0,0x3cb550,0x286b52,0x4e55b0,0x3a2776,0x5e2570,0x4852b0,0x32aaa5,0x56e950,0x406aa0,0x2abaa3,0x50ab50];
const TK20=[0x3c4bd8,0x624ae0,0x4ca570,0x3854d5,0x5cd260,0x44d950,0x315554,0x5656a0,0x409ad0,0x2a55d2,0x504ae0,0x3aa5b6,0x60a4d0,0x48d250,0x33d255,0x58b540,0x42d6a0,0x2cada2,0x5295b0,0x3f4977,0x644970,0x4ca4b0,0x36b4b5,0x5c6a50,0x466d50,0x312b54,0x562b60,0x409570,0x2c52f2,0x504970,0x3a6566,0x5ed4a0,0x48ea50,0x336a95,0x585ad0,0x442b60,0x2f86e3,0x5292e0,0x3dc8d7,0x62c950,0x4cd4a0,0x35d8a6,0x5ab550,0x4656a0,0x31a5b4,0x5625d0,0x4092d0,0x2ad2b2,0x50a950,0x38b557,0x5e6ca0,0x48b550,0x355355,0x584da0,0x42a5b0,0x2f4573,0x5452b0,0x3ca9a8,0x60e950,0x4c6aa0,0x36aea6,0x5aab50,0x464b60,0x30aae4,0x56a570,0x405260,0x28f263,0x4ed940,0x38db47,0x5cd6a0,0x4896d0,0x344dd5,0x5a4ad0,0x42a4d0,0x2cd4b4,0x52b250,0x3cd558,0x60b540,0x4ab5a0,0x3755a6,0x5c95b0,0x4649b0,0x30a974,0x56a4b0,0x40aa50,0x29aa52,0x4e6d20,0x39ad47,0x5eab60,0x489370,0x344af5,0x5a4970,0x4464b0,0x2c74a3,0x50ea50,0x3d6a58,0x6256a0,0x4aaad0,0x3696d5,0x5c92e0];
const TK21=[0x46c960,0x2ed954,0x54d4a0,0x3eda50,0x2a7552,0x4e56a0,0x38a7a7,0x5ea5d0,0x4a92b0,0x32aab5,0x58a950,0x42b4a0,0x2cbaa4,0x50ad50,0x3c55d9,0x624ba0,0x4ca5b0,0x375176,0x5c5270,0x466930,0x307934,0x546aa0,0x3ead50,0x2a5b52,0x504b60,0x38a6e6,0x5ea4e0,0x48d260,0x32ea65,0x56d520,0x40daa0,0x2d56a3,0x5256d0,0x3c4afb,0x6249d0,0x4ca4d0,0x37d0b6,0x5ab250,0x44b520,0x2edd25,0x54b5a0,0x3e55d0,0x2a55b2,0x5049b0,0x3aa577,0x5ea4b0,0x48aa50,0x33b255,0x586d20,0x40ad60,0x2d4b63,0x525370,0x3e49e8,0x60c970,0x4c54b0,0x3768a6,0x5ada50,0x445aa0,0x2fa6a4,0x54aad0,0x4052e0,0x28d2e3,0x4ec950,0x38d557,0x5ed4a0,0x46d950,0x325d55,0x5856a0,0x42a6d0,0x2c55d4,0x5252b0,0x3ca9b8,0x62a930,0x4ab490,0x34b6a6,0x5aad50,0x4655a0,0x2eab64,0x54a570,0x4052b0,0x2ab173,0x4e6930,0x386b37,0x5e6aa0,0x48ad50,0x332ad5,0x582b60,0x42a570,0x2e52e4,0x50d160,0x3ae958,0x60d520,0x4ada90,0x355aa6,0x5a56d0,0x462ae0,0x30a9d4,0x54a2d0,0x3ed150,0x28e952];

const CAN=["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"];
const CHI=["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
const TIETKHI=["Xuân phân","Thanh minh","Cốc vũ","Lập hạ","Tiểu mãn","Mang chủng","Hạ chí","Tiểu thử","Đại thử","Lập thu","Xử thử","Bạch lộ","Thu phân","Hàn lộ","Sương giáng","Lập đông","Tiểu tuyết","Đại tuyết","Đông chí","Tiểu hàn","Đại hàn","Lập xuân","Vũ Thủy","Kinh trập"];

const INT=d=>Math.floor(d);
const jdn=(dd,mm,yy)=>{const a=INT((14-mm)/12),y=yy+4800-a,m=mm+12*a-3;return dd+INT((153*m+2)/5)+365*y+INT(y/4)-INT(y/100)+INT(y/400)-32045;};

class LunarDate{constructor(dd,mm,yy,leap,jd){this.day=dd;this.month=mm;this.year=yy;this.leap=leap;this.jd=jd;}}

function decodeLunarYear(yy,k){
    const ml=[29,30],rm=new Array(12),ot=k>>17,lm=k&0xf,lml=ml[k>>16&0x1],sny=jdn(1,1,yy);
    let cjd=sny+ot,j=k>>4;
    for(let i=0;i<12;i++){rm[11-i]=ml[j&0x1];j>>=1;}
    const ly=[];
    if(lm===0){for(let m=1;m<=12;m++){ly.push(new LunarDate(1,m,yy,0,cjd));cjd+=rm[m-1];}}
    else{for(let m=1;m<=lm;m++){ly.push(new LunarDate(1,m,yy,0,cjd));cjd+=rm[m-1];}ly.push(new LunarDate(1,lm,yy,1,cjd));cjd+=lml;for(let m=lm+1;m<=12;m++){ly.push(new LunarDate(1,m,yy,0,cjd));cjd+=rm[m-1];}}
    return ly;
}

function getYearInfo(yyyy){
    let c;
    if(yyyy<1900)c=TK19[yyyy-1800];else if(yyyy<2000)c=TK20[yyyy-1900];else if(yyyy<2100)c=TK21[yyyy-2000];else return[];
    return decodeLunarYear(yyyy,c);
}

const FIRST_DAY=jdn(25,1,1800),LAST_DAY=jdn(31,12,2099);

function findLunarDate(jd,ly){
    if(jd>LAST_DAY||jd<FIRST_DAY||ly[0].jd>jd)return new LunarDate(0,0,0,0,jd);
    let i=ly.length-1;while(jd<ly[i].jd)i--;
    return new LunarDate(ly[i].day+(jd-ly[i].jd),ly[i].month,ly[i].year,ly[i].leap,jd);
}

function getLunarDate(dd,mm,yyyy){
    if(yyyy<1800||yyyy>2099)return new LunarDate(0,0,0,0,0);
    let ly=getYearInfo(yyyy);const jd=jdn(dd,mm,yyyy);
    if(jd<ly[0].jd)ly=getYearInfo(yyyy-1);
    return findLunarDate(jd,ly);
}

function getCanChi(lunar){
    const d=CAN[(lunar.jd+9)%10]+" "+CHI[(lunar.jd+1)%12];
    let m=CAN[(lunar.year*12+lunar.month+3)%10]+" "+CHI[(lunar.month+1)%12];
    if(lunar.leap)m+=" (nhuận)";
    const y=CAN[(lunar.year+6)%10]+" "+CHI[(lunar.year+8)%12];
    return{day:d,month:m,year:y};
}

function getMonthData(mm,yy){
    let mm1,yy1;if(mm<12){mm1=mm+1;yy1=yy;}else{mm1=1;yy1=yy+1;}
    const jd1=jdn(1,mm,yy),jd2=jdn(1,mm1,yy1),ly1=getYearInfo(yy),tet1=ly1[0]?.jd,r=[];
    if(tet1<=jd1){for(let i=jd1;i<jd2;i++)r.push(findLunarDate(i,ly1));}
    else if(jd1<tet1&&jd2<tet1){const ly2=getYearInfo(yy-1);for(let i=jd1;i<jd2;i++)r.push(findLunarDate(i,ly2));}
    else{const ly2=getYearInfo(yy-1);for(let i=jd1;i<tet1;i++)r.push(findLunarDate(i,ly2));for(let i=tet1;i<jd2;i++)r.push(findLunarDate(i,ly1));}
    return r;
}

function SunLongitude(j){
    const T=(j-2451545)/36525,T2=T*T,dr=Math.PI/180;
    const M=357.5291+35999.0503*T-0.0001559*T2-0.00000048*T*T2;
    const L0=280.46645+36000.76983*T+0.0003032*T2;
    let DL=(1.9146-0.004817*T-0.000014*T2)*Math.sin(dr*M);
    DL+=(0.019993-0.000101*T)*Math.sin(dr*2*M)+0.00029*Math.sin(dr*3*M);
    const theta=L0+DL,omega=125.04-1934.136*T;
    let lam=(theta-0.00569-0.00478*Math.sin(omega*dr))*dr;
    lam-=Math.PI*2*INT(lam/(Math.PI*2));
    return lam;
}

function getSunLongitude(dn,tz){return INT(SunLongitude(dn-0.5-tz/24)/Math.PI*12);}

// Ngũ hành nạp âm (Mệnh ngày)
function getMenhNgay(lunar){
    const idx=((lunar.jd+9)%10)*12+((lunar.jd+1)%12);
    // Simplified: use Can Chi cycle
    const napAm=["Hải Trung Kim","Hải Trung Kim","Lư Trung Hỏa","Lư Trung Hỏa","Đại Lâm Mộc","Đại Lâm Mộc","Lộ Bàng Thổ","Lộ Bàng Thổ","Kiếm Phong Kim","Kiếm Phong Kim","Sơn Đầu Hỏa","Sơn Đầu Hỏa","Giản Hạ Thủy","Giản Hạ Thủy","Thành Đầu Thổ","Thành Đầu Thổ","Bạch Lạp Kim","Bạch Lạp Kim","Dương Liễu Mộc","Dương Liễu Mộc","Tuyền Trung Thủy","Tuyền Trung Thủy","Ốc Thượng Thổ","Ốc Thượng Thổ","Tích Lịch Hỏa","Tích Lịch Hỏa","Tùng Bách Mộc","Tùng Bách Mộc","Trường Lưu Thủy","Trường Lưu Thủy","Sa Trung Kim","Sa Trung Kim","Sơn Hạ Hỏa","Sơn Hạ Hỏa","Bình Địa Mộc","Bình Địa Mộc","Bích Thượng Thổ","Bích Thượng Thổ","Kim Bạch Kim","Kim Bạch Kim","Phú Đăng Hỏa","Phú Đăng Hỏa","Thiên Hà Thủy","Thiên Hà Thủy","Đại Dịch Thổ","Đại Dịch Thổ","Sa Trung Thổ","Sa Trung Thổ","Thiên Thượng Hỏa","Thiên Thượng Hỏa","Thạch Lựu Mộc","Thạch Lựu Mộc","Đại Hải Thủy","Đại Hải Thủy","Tang Đố Mộc","Tang Đố Mộc","Đại Khê Thủy","Đại Khê Thủy","Sa Trung Thổ","Sa Trung Thổ"];
    return napAm[idx%60];
}

// Hoàng đạo / Hắc đạo
function isHoangDao(lunar){
    // 12 day cycle based on lunar month
    const chiDay=(lunar.jd+1)%12;
    // Hoàng đạo positions vary by lunar month
    const hoangDaoByMonth=[
        [0,1,4,6,8,10],[1,2,5,7,9,11],[2,3,6,8,10,0],[3,4,7,9,11,1],
        [4,5,8,10,0,2],[5,6,9,11,1,3],[6,7,10,0,2,4],[7,8,11,1,3,5],
        [8,9,0,2,4,6],[9,10,1,3,5,7],[10,11,2,4,6,8],[11,0,3,5,7,9]
    ];
    const monthIdx=(lunar.month-1)%12;
    return hoangDaoByMonth[monthIdx].includes(chiDay);
}

// Giờ hoàng đạo
function getGioHoangDao(lunar){
    const chiDay=(lunar.jd+1)%12;
    const gioNames=["Tý (23h-1h)","Sửu (1h-3h)","Dần (3h-5h)","Mão (5h-7h)","Thìn (7h-9h)","Tỵ (9h-11h)","Ngọ (11h-13h)","Mùi (13h-15h)","Thân (15h-17h)","Dậu (17h-19h)","Tuất (19h-21h)","Hợi (21h-23h)"];
    const hoangDaoGio=[
        [0,1,4,6,8,10],[1,2,5,7,9,11],[2,3,6,8,10,0],[3,4,7,9,11,1],
        [4,5,8,10,0,2],[5,6,9,11,1,3],[6,7,10,0,2,4],[7,8,11,1,3,5],
        [8,9,0,2,4,6],[9,10,1,3,5,7],[10,11,2,4,6,8],[11,0,3,5,7,9]
    ];
    return hoangDaoGio[chiDay%12].map(g=>gioNames[g]).join(", ");
}

// Vietnamese holidays
function getHoliday(dd,mm,lunarDay,lunarMonth,lunarLeap){
    // Solar holidays
    if(mm===1&&dd===1)return"Tết Dương lịch";
    if(mm===2&&dd===14)return"Lễ tình nhân";
    if(mm===2&&dd===27)return"Ngày thầy thuốc Việt Nam";
    if(mm===3&&dd===8)return"Quốc tế Phụ nữ";
    if(mm===4&&dd===30)return"Giải phóng miền Nam";
    if(mm===5&&dd===1)return"Quốc tế Lao động";
    if(mm===9&&dd===2)return"Quốc khánh";
    if(mm===10&&dd===20)return"Ngày Phụ nữ VN";
    if(mm===11&&dd===20)return"Ngày Nhà giáo VN";
    if(mm===12&&dd===25)return"Giáng sinh";
    // Lunar holidays
    if(lunarLeap)return null;
    if(lunarMonth===1&&lunarDay===1)return"Tết Nguyên Đán";
    if(lunarMonth===1&&lunarDay===2)return"Tết Nguyên Đán";
    if(lunarMonth===1&&lunarDay===3)return"Tết Nguyên Đán";
    if(lunarMonth===1&&lunarDay===15)return"Tết Nguyên tiêu";
    if(lunarMonth===3&&lunarDay===10)return"Giỗ Tổ Hùng Vương";
    if(lunarMonth===4&&lunarDay===15)return"Phật Đản";
    if(lunarMonth===5&&lunarDay===5)return"Tết Đoan ngọ";
    if(lunarMonth===7&&lunarDay===15)return"Vu Lan";
    if(lunarMonth===8&&lunarDay===15)return"Tết Trung thu";
    if(lunarMonth===12&&lunarDay===23)return"Tiễn Táo Quân về trời";
    return null;
}

// Tuổi xung
function getTuoiXung(lunar){
    const canNgay=(lunar.jd+9)%10;
    const chiNgay=(lunar.jd+1)%12;
    // Xung based on Chi (opposite positions)
    const xungChi=(chiNgay+6)%12;
    const tuoi=[];
    for(let c=0;c<10;c++){
        tuoi.push(CAN[c]+" "+CHI[xungChi]);
    }
    // Return a few representative ones
    return [CAN[(canNgay+4)%10]+" "+CHI[xungChi], CAN[(canNgay+6)%10]+" "+CHI[xungChi], CAN[canNgay]+" "+CHI[xungChi], CAN[(canNgay+2)%10]+" "+CHI[xungChi]].join(", ");
}
