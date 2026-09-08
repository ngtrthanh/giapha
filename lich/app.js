(function(){
const today=new Date();
let viewMonth=today.getMonth()+1,viewYear=today.getFullYear();
let selectedDate=new Date(today);
let panelOpen=false,panelMonth=today.getMonth()+1,panelYear=today.getFullYear();
// Panel solar/lunar dropdown state
let pSolarD=today.getDate(),pSolarM=today.getMonth()+1,pSolarY=today.getFullYear();
let pLunarD,pLunarM,pLunarY;
(function(){const l=getLunarDate(pSolarD,pSolarM,pSolarY);pLunarD=l.day;pLunarM=l.month;pLunarY=l.year;})();

function render(){
    const root=document.getElementById('root');
    const sd=selectedDate,dd=sd.getDate(),mm=sd.getMonth()+1,yy=sd.getFullYear();
    const lunar=getLunarDate(dd,mm,yy);
    const cc=getCanChi(lunar);
    const menh=getMenhNgay(lunar);
    const hd=isHoangDao(lunar);
    const gioHD=getGioHoangDao(lunar);
    const tuoiXung=getTuoiXung(lunar);

    const lunarYearStr=`Tháng ${lunar.month}${lunar.leap?' nhuận':''} năm ${cc.year}`;

    // Month/year selects
    let mOpts='',yOpts='';
    for(let i=1;i<=12;i++)mOpts+=`<option value="${i}"${i===viewMonth?' selected':''}>Tháng ${i}</option>`;
    for(let i=1800;i<=2099;i++)yOpts+=`<option value="${i}"${i===viewYear?' selected':''}>${i}</option>`;

    // Calendar grid
    const first=new Date(viewYear,viewMonth-1,1);
    let startDow=(first.getDay()+6)%7; // Mon=0
    const startD=new Date(first);startD.setDate(startD.getDate()-startDow);
    const lastDay=new Date(viewYear,viewMonth,0);
    const rows=Math.ceil((startDow+lastDay.getDate())/7);

    const weekH=['Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy','Chủ nhật'];
    let headHtml=weekH.map((w,i)=>`<div class="cal-head${i===6?' sun':''}">${w}</div>`).join('');

    let cells='';
    for(let i=0;i<rows*7;i++){
        const d=new Date(startD);d.setDate(startD.getDate()+i);
        const cdd=d.getDate(),cmm=d.getMonth()+1,cyy=d.getFullYear();
        const l=getLunarDate(cdd,cmm,cyy);
        const isOther=cmm!==viewMonth||cyy!==viewYear;
        const isToday=d.toDateString()===today.toDateString();
        const isSel=d.toDateString()===selectedDate.toDateString();
        const dow=d.getDay(); // 0=Sun
        const hol=getHoliday(cdd,cmm,l.day,l.month,l.leap);
        const isTet=!l.leap&&l.month===1&&l.day>=1&&l.day<=3;
        const hdDay=isHoangDao(l);
        const lcc=CAN[(l.jd+9)%10]+" "+CHI[(l.jd+1)%12];

        let cls='cal-cell';
        if(isOther)cls+=' other';
        if(isToday)cls+=' today';
        if(isSel&&!isOther)cls+=' selected';
        if(hol&&isTet)cls+=' tet-cell';
        else if(hol)cls+=' holiday-cell';

        let sCls='solar';
        if(dow===0)sCls+=' sun';else if(dow===6)sCls+=' sat';

        // Lunar text: show month/day on 1st lunar day or 1st solar day of month
        let lunarTxt=l.day===1?`${l.day}/${l.month}`:String(l.day);
        if(l.leap&&l.day===1)lunarTxt+='*';
        // Lunar color: red for holidays/special, green for 1st lunar day
        let lunarCls='lunar';
        if(l.day===1)lunarCls+=' lunar-green';
        else if(hol)lunarCls+=' lunar-red';
        else lunarCls+=' lunar-red';

        // Dot indicator
        let dotHtml=hdDay
            ?'<span class="dot hoangdao"></span>'
            :'<span class="dot hacdao"></span>';

        // Bottom text
        let bottomHtml=hol
            ?`<div class="holiday">${hol}</div>`
            :`<div class="cc-name">${lcc}</div>`;

        cells+=`<div class="${cls}" onclick="selectDay(${cyy},${cmm},${cdd})">
            <div class="cell-top">
                <span class="${sCls}">${cdd}</span>
                <span class="cell-right">${dotHtml}<span class="${lunarCls}">${lunarTxt}</span></span>
            </div>
            ${bottomHtml}
        </div>`;
    }

    root.innerHTML=`<div class="container">
        <div class="header">
            <h1>LỊCH VẠN NIÊN</h1>
            <button class="btn-today" onclick="goToday()">📅 Xem nhanh theo ngày</button>
        </div>

        <div class="day-display">
            <button class="nav-arrow left" onclick="navDay(-1)">‹</button>
            <div class="solar-side">
                <div class="day-label">Dương Lịch</div>
                <div class="big-num">${dd}</div>
                <div class="solar-sub">tháng ${String(mm).padStart(2,'0')} năm ${yy}</div>
            </div>
            <div class="lunar-side">
                <div class="day-label">Âm Lịch</div>
                <div class="big-num">${lunar.day}</div>
                <div class="lunar-sub">${lunarYearStr}<br><span class="red">Ngày ${cc.day} - Tháng ${cc.month}</span></div>
            </div>
            <button class="nav-arrow right" onclick="navDay(1)">›</button>
        </div>

        <div class="detail-box">
            <b>Mệnh ngày:</b> ${menh} - Ngày ${hd?'hoàng đạo':'hắc đạo'}<br>
            <b>Giờ hoàng đạo:</b> ${gioHD}<br>
            <b>Tuổi xung:</b> ${tuoiXung}
        </div>

        <div class="month-nav">
            <div class="month-arrows">
                <button onclick="navMonth(-1)">‹</button>
                <button onclick="navMonth(1)">›</button>
            </div>
            <div class="month-title">THÁNG ${String(viewMonth).padStart(2,'0')} - ${viewYear}</div>
            <select id="selMonth" onchange="setMonth()">${mOpts}</select>
            <select id="selYear" onchange="setMonth()">${yOpts}</select>
            <button class="btn-view" onclick="setMonth()">XEM</button>
        </div>

        <div class="cal-wrap">
            <div class="cal-grid">
                ${headHtml}
                ${cells}
            </div>
        </div>

        <div class="legend">
            <div class="legend-item"><span class="ldot hoangdao"></span> Ngày hoàng đạo</div>
            <div class="legend-item"><span class="ldot hacdao"></span> Ngày hắc đạo</div>
            <select class="font-picker-inline" onchange="setFont(this.value)"><option value="Inter">Inter</option><option value="IBM Plex Sans">IBM Plex Sans</option><option value="Poppins">Poppins</option><option value="Roboto Condensed">Roboto Condensed</option><option value="Space Grotesk">Space Grotesk</option></select>
        </div>
    </div>${renderPanel()}`;
}

window.navDay=function(dir){selectedDate.setDate(selectedDate.getDate()+dir);viewMonth=selectedDate.getMonth()+1;viewYear=selectedDate.getFullYear();render();};
window.navMonth=function(dir){viewMonth+=dir;if(viewMonth>12){viewMonth=1;viewYear++;}if(viewMonth<1){viewMonth=12;viewYear--;}render();};
window.setMonth=function(){const m=document.getElementById('selMonth'),y=document.getElementById('selYear');if(m&&y){viewMonth=+m.value;viewYear=+y.value;}render();};
window.selectDay=function(yy,mm,dd){selectedDate=new Date(yy,mm-1,dd);viewMonth=mm;viewYear=yy;render();};
window.goToday=function(){panelOpen=true;syncPanelToSelected();render();};

function syncPanelToSelected(){
    pSolarD=selectedDate.getDate();pSolarM=selectedDate.getMonth()+1;pSolarY=selectedDate.getFullYear();
    const l=getLunarDate(pSolarD,pSolarM,pSolarY);pLunarD=l.day;pLunarM=l.month;pLunarY=l.year;
    panelMonth=pSolarM;panelYear=pSolarY;
}

window.closePanel=function(){panelOpen=false;render();};
window.panelNav=function(dir){panelMonth+=dir;if(panelMonth>12){panelMonth=1;panelYear++;}if(panelMonth<1){panelMonth=12;panelYear--;}render();};
window.panelPickDay=function(yy,mm,dd){
    pSolarD=dd;pSolarM=mm;pSolarY=yy;
    const l=getLunarDate(dd,mm,yy);pLunarD=l.day;pLunarM=l.month;pLunarY=l.year;
    panelMonth=mm;panelYear=yy;
    render();
};
window.panelSolarChange=function(){
    const d=document.getElementById('ps-d'),m=document.getElementById('ps-m'),y=document.getElementById('ps-y');
    if(d&&m&&y){pSolarD=+d.value;pSolarM=+m.value;pSolarY=+y.value;
    const l=getLunarDate(pSolarD,pSolarM,pSolarY);pLunarD=l.day;pLunarM=l.month;pLunarY=l.year;render();}
};
window.panelLunarChange=function(){
    // Lunar→Solar is complex; just update display values
    const d=document.getElementById('pl-d'),m=document.getElementById('pl-m'),y=document.getElementById('pl-y');
    if(d&&m&&y){pLunarD=+d.value;pLunarM=+m.value;pLunarY=+y.value;}
};
window.panelXem=function(){
    selectedDate=new Date(pSolarY,pSolarM-1,pSolarD);
    viewMonth=pSolarM;viewYear=pSolarY;
    panelOpen=false;render();
};

function renderPanel(){
    if(!panelOpen)return'';
    const first=new Date(panelYear,panelMonth-1,1);
    let startDow=(first.getDay()+6)%7;
    const startD=new Date(first);startD.setDate(startD.getDate()-startDow);
    const lastDay=new Date(panelYear,panelMonth,0);
    const rows=Math.ceil((startDow+lastDay.getDate())/7);

    const wh=['Th 2','Th 3','Th 4','Th 5','Th 6','Th 7','CN'];
    let hd=wh.map((w,i)=>`<div class="mini-head${i===6?' sun':''}">${w}</div>`).join('');
    let cells='';
    for(let i=0;i<rows*7;i++){
        const d=new Date(startD);d.setDate(startD.getDate()+i);
        const cdd=d.getDate(),cmm=d.getMonth()+1,cyy=d.getFullYear();
        const l=getLunarDate(cdd,cmm,cyy);
        const isOther=cmm!==panelMonth;
        const isToday=d.toDateString()===today.toDateString();
        const isSun=d.getDay()===0;
        let cls='mini-cell';
        if(isOther)cls+=' m-other';
        if(isToday)cls+=' m-today';
        let sCls='m-solar';if(isSun)sCls+=' sun';
        let lt=l.day===1?l.day+'/'+l.month:String(l.day);
        cells+=`<div class="${cls}" onclick="panelPickDay(${cyy},${cmm},${cdd})"><div class="${sCls}">${cdd}</div><div class="m-lunar">${lt}</div></div>`;
    }

    // Solar dropdowns
    let sdOpts='',smOpts='',syOpts='';
    const daysInM=new Date(pSolarY,pSolarM,0).getDate();
    for(let i=1;i<=daysInM;i++)sdOpts+=`<option value="${i}"${i===pSolarD?' selected':''}>Ngày ${i}</option>`;
    for(let i=1;i<=12;i++)smOpts+=`<option value="${i}"${i===pSolarM?' selected':''}>Tháng ${i}</option>`;
    for(let i=1900;i<=2099;i++)syOpts+=`<option value="${i}"${i===pSolarY?' selected':''}>${i}</option>`;

    // Lunar dropdowns
    let ldOpts='',lmOpts='',lyOpts='';
    for(let i=1;i<=30;i++)ldOpts+=`<option value="${i}"${i===pLunarD?' selected':''}>Ngày ${i}</option>`;
    for(let i=1;i<=12;i++)lmOpts+=`<option value="${i}"${i===pLunarM?' selected':''}>Tháng ${i}</option>`;
    for(let i=1900;i<=2099;i++)lyOpts+=`<option value="${i}"${i===pLunarY?' selected':''}>${i}</option>`;

    return`<div class="panel-overlay" onclick="closePanel()"><div class="panel" onclick="event.stopPropagation()">
        <div class="panel-header">
            <div class="p-title">THÁNG ${String(panelMonth).padStart(2,'0')} - ${panelYear}</div>
            <div class="p-nav"><button onclick="panelNav(-1)">‹</button><button onclick="panelNav(1)">›</button></div>
        </div>
        <div class="mini-grid">${hd}${cells}</div>
        <div class="panel-form">
            <div class="pf-section">
                <div class="pf-label"><span class="icon">☀️</span> Dương Lịch</div>
                <div class="pf-row">
                    <select id="ps-d" onchange="panelSolarChange()">${sdOpts}</select>
                    <select id="ps-m" onchange="panelSolarChange()">${smOpts}</select>
                    <select id="ps-y" onchange="panelSolarChange()">${syOpts}</select>
                </div>
            </div>
            <div class="pf-section">
                <div class="pf-label"><span class="icon">🌙</span> Âm Lịch</div>
                <div class="pf-row">
                    <select id="pl-d" onchange="panelLunarChange()">${ldOpts}</select>
                    <select id="pl-m" onchange="panelLunarChange()">${lmOpts}</select>
                    <select id="pl-y" onchange="panelLunarChange()">${lyOpts}</select>
                </div>
            </div>
            <button class="btn-xem" onclick="panelXem()">XEM</button>
        </div>
    </div></div>`;
}

let currentFont='Inter';
window.setFont=function(f){currentFont=f;document.body.style.fontFamily="'"+f+"',sans-serif";document.querySelector('.font-picker select').style.fontFamily="'"+f+"',sans-serif";};

render();
})();
