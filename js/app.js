(function(){
  "use strict";

  const $ = sel => document.querySelector(sel);
  const fmt = d => d ? new Intl.DateTimeFormat(undefined, {year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(d) : '—';
  const hours = h => h * 3600 * 1000;
  const minutes = m => m * 60 * 1000;

  const dwell = code => ({
    'DROP30': minutes(30),
    'DROP60': minutes(60),
    'LIVE60': minutes(60),
    'LIVE120': minutes(120),
    'BACKHAUL90': minutes(90)
  }[code] ?? 0);

  function statusClass(eta, appt){
    if(!eta || !appt) return {label: fmt(eta), cls: ''};
    const diffMin = Math.round((appt - eta)/60000);
    if(diffMin < 0){ return {label: fmt(eta) + ' • LATE', cls:'late'}; }
    if(diffMin > 60){ return {label: fmt(eta) + ' • TOO EARLY', cls:'warn'}; }
    return {label: fmt(eta) + ' • ON TIME', cls:'ok'};
  }

  // --- Recent trips storage helpers ---
  const RECENT_KEY = "hosRecentTrips_v2";
  let recentTrips = [];

  function loadRecentTrips(){
    try{
      const raw = localStorage.getItem(RECENT_KEY);
      if(!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    }catch(e){
      console.error("Recent trips load error", e);
      return [];
    }
  }

  function saveRecentTrips(){
    try{
      localStorage.setItem(RECENT_KEY, JSON.stringify(recentTrips));
    }catch(e){
      console.error("Recent trips save error", e);
    }
  }

  function renderRecentTrips(){
    const listEl = $('#recentTripsList');
    if(!listEl) return;
    if(!recentTrips.length){
      listEl.textContent = "No trips saved yet.";
      return;
    }
    listEl.innerHTML = "";
    recentTrips.forEach(trip=>{
      const div = document.createElement('div');
      div.className = "recent-trip";

      const title = document.createElement('div');
      title.className = "recent-trip-title";
      title.textContent = trip.tripId || "(no ID)";

      const meta1 = document.createElement('div');
      meta1.className = "recent-trip-meta";
      meta1.textContent =
        `Start: ${trip.tripStartFmt || "—"} • ` +
        `Shipper Appt: ${trip.shipperApptFmt || "—"} • ` +
        `Final (90) Appt: ${trip.consApptFmt || "—"}`;

      const meta2 = document.createElement('div');
      meta2.className = "recent-trip-meta";
      meta2.textContent =
        `DH: ${trip.dh ?? "—"} • LD: ${trip.lm ?? "—"} • TOT: ${trip.totalMiles ?? "—"} • ` +
        `ETA Shipper: ${trip.etaShFmt || "—"} • PTA Final: ${trip.ptaCoFmt || "—"}`;

      div.appendChild(title);
      div.appendChild(meta1);
      div.appendChild(meta2);
      listEl.appendChild(div);
    });
  }

  function saveRecentTrip(meta){
    recentTrips.unshift(meta);
    if(recentTrips.length > 8) recentTrips.length = 8;
    saveRecentTrips();
    renderRecentTrips();
  }

  const clearBtn = $('#clearTrips');
  if(clearBtn){
    clearBtn.addEventListener('click', ()=>{
      if(confirm("Clear all recent trips from this device?")){
        recentTrips = [];
        saveRecentTrips();
        renderRecentTrips();
      }
    });
  }

  $('#genId').addEventListener('click', ()=>{
    const now = new Date();
    const stamp = now.toISOString().replace(/\D/g,'').slice(2,12);
    $('#tripId').value = 'TRIP' + stamp;
  });

  const mph = $('#mph'), mphVal = $('#mphVal'); 
  mph.addEventListener('input', ()=> mphVal.textContent = mph.value);
  mphVal.textContent = mph.value;
  
function recalcTotal(){
  const d = parseFloat($('#deadhead').value||0);
  const l = parseFloat($('#loaded').value||0);
  $('#total').value = isFinite(d+l) ? (d+l) : '';
}
$('#deadhead').addEventListener('input', recalcTotal);
$('#loaded').addEventListener('input', recalcTotal);
recalcTotal();
  
function valDate(s){
  if(!s) return null;
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

function analyzeSplitSleeper({
  totalMiles,
  tripStart,
  ptaSh,
  etaCo,
  consAppt,
  extraRestMs
}){
  const result = {
    feasible: 'NOT RUN',
    splitType: '—',
    offStart: '—',
    offEnd: '—',
    updatedEta: '—'
  };

  if (!tripStart || !ptaSh || !etaCo) {
    return result;
  }

  if (totalMiles <= 450) {
    result.feasible = 'NO BENEFIT';
    return result;
  }

  let splitType = '7/3';
  let offDutyHours = 7;

  if (totalMiles >= 600) {
    splitType = '8/2';
    offDutyHours = 8;
  }

  result.splitType = splitType;

  const offStartDate = new Date(ptaSh.getTime() + (2 * 60 * 60 * 1000));
  const offEndDate = new Date(offStartDate.getTime() + (offDutyHours * 60 * 60 * 1000));

  result.offStart = fmt(offStartDate);
  result.offEnd = fmt(offEndDate);

  let updatedEtaDate = new Date(etaCo.getTime());

  if (extraRestMs > 0) {
    updatedEtaDate = new Date(etaCo.getTime() - extraRestMs);
    result.feasible = 'IMPROVES ETA';
  } else {
    result.feasible = 'NOT FEASIBLE';
  }

  result.updatedEta = fmt(updatedEtaDate);

  return result;
}
function analyzeRecap(){
  const days = [
    parseFloat($('#recapDay1').value || 0),
    parseFloat($('#recapDay2').value || 0),
    parseFloat($('#recapDay3').value || 0),
    parseFloat($('#recapDay4').value || 0),
    parseFloat($('#recapDay5').value || 0),
    parseFloat($('#recapDay6').value || 0),
    parseFloat($('#recapDay7').value || 0),
    parseFloat($('#recapDay8').value || 0)
  ].map(v => isFinite(v) ? v : 0);

  const used = days.reduce((sum, v) => sum + v, 0);
  const available = Math.max(0, 70 - used);
  const tomorrowGain = days[0];

  return {
    used,
    available,
    tomorrowGain
  };
}
function analyzeLatestDispatch({
  tripStart,
  shipAppt,
  consAppt,
  driveToShipperHrs,
  fuelBeforeMs,
  ptaSh,
  fuelAfterShipperMs,
  loadedMiles,
  mph,
  breakMs,
  extraRestMs
}){
  const result = {
    latestShipper: '—',
    latestFinal: '—'
  };

  if (tripStart && shipAppt && isFinite(driveToShipperHrs)) {
    const latestShipperDate = new Date(
      shipAppt.getTime()
      - fuelBeforeMs
      - hours(driveToShipperHrs)
    );
    result.latestShipper = fmt(latestShipperDate);
  }

  if (consAppt && ptaSh && isFinite(loadedMiles) && isFinite(mph) && mph > 0) {
    const driveToFinalHrs = loadedMiles / mph;
    const latestFinalDate = new Date(
      consAppt.getTime()
      - fuelAfterShipperMs
      - hours(driveToFinalHrs)
      - breakMs
      - extraRestMs
    );
    result.latestFinal = fmt(latestFinalDate);
  }

  return result;
} 
  function analyzeAppointmentFeasibility({
  etaSh,
  shipAppt,
  etaCo,
  consAppt
}){
  const result = {
    shipperFeasibility: 'NO APPT',
    finalFeasibility: 'NO APPT',
    loadRunStatus: 'CHECK APPTS'
  };

  if (shipAppt && etaSh) {
    result.shipperFeasibility = etaSh <= shipAppt ? 'MAKE SHIPPER' : 'MISS SHIPPER';
  }

  if (consAppt && etaCo) {
    result.finalFeasibility = etaCo <= consAppt ? 'MAKE FINAL' : 'MISS FINAL';
  }

  if (
    result.shipperFeasibility === 'MAKE SHIPPER' &&
    result.finalFeasibility === 'MAKE FINAL'
  ) {
    result.loadRunStatus = 'LOAD CAN RUN';
  }
  else if (
    result.shipperFeasibility === 'MISS SHIPPER' ||
    result.finalFeasibility === 'MISS FINAL'
  ) {
    result.loadRunStatus = 'LOAD AT RISK';
  }
  else if (
    result.shipperFeasibility === 'NO APPT' &&
    result.finalFeasibility === 'NO APPT'
  ) {
    result.loadRunStatus = 'CHECK APPTS';
  }
  else {
    result.loadRunStatus = 'PARTIAL CHECK';
  }

  return result;
}

// STOP 02 visibility toggle
const stop2EnabledEl = $('#stop2Enabled');
const stop2Fields = $('#stop2Fields');
const stop2Results = $('#stop2Results');
function updateStop2Visibility(){
  if(!stop2Fields || !stop2EnabledEl) return;
  stop2Fields.style.display = stop2EnabledEl.checked ? 'grid' : 'none';
}
if(stop2EnabledEl){
  stop2EnabledEl.addEventListener('change', updateStop2Visibility);
  updateStop2Visibility();
}

  function showResults(data){
    const wrap = $('#results');
    if(!data){ wrap.style.display='none'; return; }
    wrap.style.display='block';

    // Shipper / STOP 01
    const etaShStat = $('#etaShStat'), etaShExplain = $('#etaShExplain');
    etaShStat.textContent = data.etaSh.label;
    etaShStat.className = 'stat ' + (data.etaSh.cls||'');
    etaShExplain.textContent = data.explainSh;
    $('#ptaShVal').textContent = fmt(data.ptaSh);

    // STOP 02 (optional)
    if(stop2Results){
      if(data.stop2Active && data.etaSt2){
        stop2Results.style.display = 'block';
        const etaSt2Stat = $('#etaSt2Stat');
        const etaSt2Explain = $('#etaSt2Explain');
        etaSt2Stat.textContent = data.etaSt2.label;
        etaSt2Stat.className = 'stat ' + (data.etaSt2.cls||'');
        etaSt2Explain.textContent = data.explainSt2 || '';
        $('#ptaSt2Val').textContent = fmt(data.ptaSt2);
      } else {
        stop2Results.style.display = 'none';
      }
    }

    // FINAL (90)
    const etaCoStat = $('#etaCoStat'), etaCoExplain = $('#etaCoExplain');
    etaCoStat.textContent = data.etaCo.label;
    etaCoStat.className = 'stat ' + (data.etaCo.cls||'');
    etaCoExplain.textContent = data.explainCo;
    $('#ptaCoVal').textContent = fmt(data.ptaCo);
    $('#splitFeasible').textContent = data.splitFeasible || 'NOT RUN';
    $('#splitType').textContent = data.splitType || '—';
    $('#splitOffStart').textContent = data.splitOffStart || '—';
    $('#splitOffEnd').textContent = data.splitOffEnd || '—';
    $('#splitEtaFinal').textContent = data.splitEtaFinal || '—';
    $('#recapUsed').textContent = (data.recapUsed ?? '—');
    $('#recapAvailable').textContent = (data.recapAvailable ?? '—');
    $('#recapTomorrow').textContent = (data.recapTomorrow ?? '—');
    $('#latestDispatchShipper').textContent = data.latestDispatchShipper || '—';
    $('#latestDispatchFinal').textContent = data.latestDispatchFinal || '—';
    $('#shipperFeasibility').textContent = data.shipperFeasibility || '—';
    $('#finalFeasibility').textContent = data.finalFeasibility || '—';
    $('#loadRunStatus').textContent = data.loadRunStatus || '—';
   }

  function explainETA(
    eta,
    appt,
    breakMs = 0,
    bufferMs = 0,
    dwellMs = 0,
    extraRestMs = 0,
    fuelMs = 0
  ){
    const parts = [];

    if (breakMs) parts.push('+ 30m rest');
    if (fuelMs) {
      parts.push(`+ ${Math.round(fuelMs / 60000)}m fuel stop (on-duty)`);
    }
    if (dwellMs) {
      parts.push(`+ ${Math.round(dwellMs / 60000)}m dwell`);
    }
    if (extraRestMs) {
      const h = Math.round(extraRestMs / 3600000);
      parts.push(`+ ${h}h off-duty resets`);
    }
    if (bufferMs) {
      const h = Math.round(bufferMs / 3600000);
      parts.push(`+ ${h}h buffer`);
    }
    if (appt) {
      const diffMin = Math.round((appt - eta) / 60000);
      if (diffMin < 0) parts.push(`${Math.abs(diffMin)} min late`);
      else if (diffMin > 60) parts.push(`${Math.abs(diffMin)} min early`);
      else parts.push('within 60 min window');
    }

    return parts.length ? parts.join(' • ') : '';
  }

  // === runCalc with 450 miles / 9-hr / multi-day logic + STOP 02 ===
  function runCalc(){
    const tripStart = valDate($('#tripStart').value);
    const dh = parseFloat($('#deadhead').value||0);
    const lm = parseFloat($('#loaded').value||0);
    
    // 1. Get the base speed from the slider
    let v = Math.max(50, Math.min(75, parseFloat($('#mph').value||60)));
    
    // 2. Check the cargo weight dropdown
    const weightBracket = parseFloat($('#cargoWeight').value || 0);

    // 3. The "IF/THEN" Logic: Slow down based on weight
    if (weightBracket >= 61000) {
      v = v - 3; // Max Load: Slow down by 3 MPH
    } else if (weightBracket >= 41000) {
      v = v - 2; // Heavy: Slow down by 2 MPH
    } else if (weightBracket >= 20000) {
      v = v - 1; // Medium: Slow down by 1 MPH
    }
    
    const shipAppt = valDate($('#shipperAppt').value);
    const consAppt = valDate($('#consAppt').value);
    const shipStop = $('#shipperStop').value;
    const consStop = $('#consStop').value;
    const tripId = $('#tripId').value || '';

    // STOP 02 inputs
    const stop2Enabled = !!(stop2EnabledEl && stop2EnabledEl.checked);
    const stop2Appt = stop2Enabled ? valDate($('#stop2Appt').value) : null;
    const stop2Stop = stop2Enabled ? $('#stop2Stop').value : null;
    const milesToStop2Raw = stop2Enabled ? parseFloat($('#milesToStop2').value || 0) : 0;
    const milesToStop2 = stop2Enabled && isFinite(milesToStop2Raw) ? milesToStop2Raw : 0;

    // Fuel inputs
    const fuelEnabled  = $('#fuelEnabled').checked;
    const fuelMinutes  = parseFloat($('#fuelMinutes').value || 0);
    const fuelWhen     = $('#fuelWhen').value || 'afterShipper';

    let fuelBeforeMs        = 0;
    let fuelAfterShipperMs  = 0;
    let fuelAfterConsigneeMs = 0;

    if (fuelEnabled && fuelMinutes > 0) {
      const fm = minutes(fuelMinutes);
      if (fuelWhen === 'before') {
        fuelBeforeMs = fm;
      } else if (fuelWhen === 'afterShipper') {
        fuelAfterShipperMs = fm;
      } else if (fuelWhen === 'afterConsignee') {
        fuelAfterConsigneeMs = fm; // interpreted as fuel after final stop
      }
    }

    const totalMiles = (isFinite(dh)?dh:0) + (isFinite(lm)?lm:0);
    $('#total').value = totalMiles;

    if(!tripStart || v<=0){
      showResults(null);
      alert('Enter at least: Trip Start, MPH, and miles.');
      return;
    }
    // Trip start sanity checks
if (shipAppt && shipAppt < tripStart) {
  alert("ERROR: Shipper appointment cannot be before Trip Start.");
  return;
}

if (consAppt && consAppt < tripStart) {
  alert("ERROR: Final (90) appointment cannot be before Trip Start.");
  return;
}
    // basic appointment sanity checks
    if (shipAppt && consAppt && consAppt < shipAppt) {
      alert("ERROR: Final (90) appointment cannot be before SHIPPER appointment.");
      return;
    }
    if (stop2Enabled) {
      if (!stop2Appt) {
        alert("ERROR: STOP 02 is enabled but has no appointment time.");
        return;
      }
      if (shipAppt && stop2Appt && stop2Appt < shipAppt) {
        alert("ERROR: STOP 02 appointment cannot be before SHIPPER appointment.");
        return;
      }
      if (stop2Appt && consAppt && consAppt < stop2Appt) {
        alert("ERROR: Final (90) appointment cannot be before STOP 02 appointment.");
        return;
      }
      if (milesToStop2 <= 0 || !isFinite(milesToStop2)) {
        alert("ERROR: MILES TO STOP 02 must be greater than zero when STOP 02 is enabled.");
        return;
      }
      if (lm > 0 && milesToStop2 > lm) {
        alert("ERROR: MILES TO STOP 02 cannot be greater than total LOADED MILES.");
        return;
      }
    }

    // --- BASE DRIVE SEGMENTS ---

    // Trip start -> SHIPPER (STOP 01)
    const driveToShipperHrs = (isFinite(dh)?dh:0) / v;
    const ETA_SH = new Date(
      tripStart.getTime()
      + fuelBeforeMs
      + hours(driveToShipperHrs)
    );
    const PTA_SH = new Date(ETA_SH.getTime() + dwell(shipStop));

    // Safety limits
    const MAX_DRIVE_MILES = 450;
    const SAFETY_MAX_DRIVE_HRS = 9;
    const FMCSA_MAX_DRIVE_HRS = 11;

    const totalDrivingHrs = totalMiles <= 0 ? 0 : (totalMiles / v);
    const breakMs = totalDrivingHrs >= 8 ? minutes(30) : 0;

    const finalDwell = dwell(consStop);

    // Time equivalent of 450 miles at entered MPH
    const maxDailyDriveHrsFromMiles = MAX_DRIVE_MILES / v;

    // Driver-favorable safety limit
    const driverFavorableSafetyLimit = Math.max(
      SAFETY_MAX_DRIVE_HRS,
      maxDailyDriveHrsFromMiles
    );

    const maxDailyDriveHrs = Math.min(
      FMCSA_MAX_DRIVE_HRS,
      driverFavorableSafetyLimit
    );

    const requiredDrivingDays = totalDrivingHrs <= 0
      ? 0
      : Math.ceil(totalDrivingHrs / maxDailyDriveHrs);

    const requiredBreaks = Math.max(0, requiredDrivingDays - 1);
    const extraRestMs = hours(12) * requiredBreaks; // 2hr parking buffer + 10hr reset

    // --- STOP 02 + FINAL (90) ETA LOGIC ---

    let ETA_ST2 = null;
    let PTA_ST2 = null;
    let ETA_CO = null;
    let PTA_CO = null;

    const loadedMilesSafe = isFinite(lm) ? lm : 0;
    const milesToStop2Safe = isFinite(milesToStop2) ? milesToStop2 : 0;

    if (stop2Enabled && milesToStop2Safe > 0) {
      // Leg 1: SHIPPER -> STOP 02
      const driveToStop2Hrs = milesToStop2Safe / v;
      ETA_ST2 = new Date(
        PTA_SH.getTime()
        + fuelAfterShipperMs
        + hours(driveToStop2Hrs)
      );
      PTA_ST2 = new Date(ETA_ST2.getTime() + dwell(stop2Stop));

      // Leg 2: STOP 02 -> FINAL (90)
      const remainingLoadedMiles = Math.max(0, loadedMilesSafe - milesToStop2Safe);
      const driveAfterStop2Hrs = remainingLoadedMiles / v;

      ETA_CO = new Date(
        PTA_ST2.getTime()
        + hours(driveAfterStop2Hrs)
        + breakMs
        + extraRestMs
      );
      PTA_CO = new Date(ETA_CO.getTime() + finalDwell);
    } else {
      // No STOP 02: SHIPPER -> FINAL (90) in one leg (same as older PRO behavior)
      const driveToConsHrs = loadedMilesSafe / v;
      ETA_CO = new Date(
        PTA_SH.getTime()
        + fuelAfterShipperMs
        + hours(driveToConsHrs)
        + breakMs
        + extraRestMs
      );
      PTA_CO = new Date(ETA_CO.getTime() + finalDwell);
    }
    const splitBasePta = (stop2Enabled && PTA_ST2) ? PTA_ST2 : PTA_SH;
    // We don't add fuelAfterConsigneeMs to ETA to final, since that's after the last stop.
    // It could be added into PTA if we ever want PTA "free after fuel", but left out for now.
    const afterConsBufferMs = 0;
    const fuelForFinalMs = fuelAfterShipperMs; // fuel that actually affects on-road ETA
    const splitAnalysis = analyzeSplitSleeper({
  totalMiles,
  tripStart,
  ptaSh: splitBasePta,
  etaCo: ETA_CO,
  consAppt,
  extraRestMs
});
    const recapAnalysis = analyzeRecap();
    const latestDispatchAnalysis = analyzeLatestDispatch({
  tripStart,
  shipAppt,
  consAppt,
  driveToShipperHrs,
  fuelBeforeMs,
  ptaSh: PTA_SH,
  fuelAfterShipperMs,
  loadedMiles: loadedMilesSafe,
  mph: v,
  breakMs,
  extraRestMs
});
    const appointmentFeasibility = analyzeAppointmentFeasibility({
  etaSh: ETA_SH,
  shipAppt,
  etaCo: ETA_CO,
  consAppt
});

    // --- STATUS + EXPLANATION ---

    const etaSh = statusClass(ETA_SH, shipAppt);
    const etaCo = statusClass(ETA_CO, consAppt);

    let stop2Active = false;
    let etaSt2Status = null;
    if (stop2Enabled && ETA_ST2) {
      stop2Active = true;
      etaSt2Status = statusClass(ETA_ST2, stop2Appt);
    }

    const payload = {
      etaSh,
      ptaSh: PTA_SH,
      stop2Active,
      etaSt2: etaSt2Status,
      ptaSt2: PTA_ST2,
      etaCo,
      ptaCo: PTA_CO,
      explainSh: explainETA(ETA_SH, shipAppt),
      explainSt2: stop2Active
        ? explainETA(ETA_ST2, stop2Appt, 0, 0, dwell(stop2Stop), 0, 0)
        : '',
      explainCo: explainETA(
        ETA_CO,
        consAppt,
        breakMs,
        afterConsBufferMs,
        finalDwell,
        extraRestMs,
        fuelForFinalMs
      ),
      splitFeasible: splitAnalysis.feasible,
      splitType: splitAnalysis.splitType,
      splitOffStart: splitAnalysis.offStart,
      splitOffEnd: splitAnalysis.offEnd,
      splitEtaFinal: splitAnalysis.updatedEta,
      recapUsed: recapAnalysis.used,
      recapAvailable: recapAnalysis.available,
      recapTomorrow: recapAnalysis.tomorrowGain,
      latestDispatchShipper: latestDispatchAnalysis.latestShipper,
      latestDispatchFinal: latestDispatchAnalysis.latestFinal,
      shipperFeasibility: appointmentFeasibility.shipperFeasibility,
      finalFeasibility: appointmentFeasibility.finalFeasibility,
      loadRunStatus: appointmentFeasibility.loadRunStatus,      
    };

    showResults(payload);

    // --- SAVE TO RECENT TRIPS ---

    saveRecentTrip({
      tripId,
      tripStartFmt: fmt(tripStart),
      shipperApptFmt: shipAppt ? fmt(shipAppt) : "—",
      consApptFmt: consAppt ? fmt(consAppt) : "—",
      dh: isFinite(dh) ? dh : "",
      lm: isFinite(lm) ? lm : "",
      totalMiles: isFinite(totalMiles) ? totalMiles : "",
      etaShFmt: fmt(ETA_SH),
      ptaCoFmt: fmt(PTA_CO),
      createdAt: new Date().toISOString()
    });
  }

  $('#calc').addEventListener('click', runCalc);

  function resetCalculations(){
    document.querySelectorAll('input').forEach(el=>{
      if(el.type==='range'){
        el.value=60; 
        $('#mphVal').textContent=60;
      }
      else if(el.type==='number' || el.type==='datetime-local' || el.type==='text'){
        if(el.id === 'fuelMinutes') {
          el.value = 30;
        } else {
          el.value='';
        }
      }
      else if(el.type === 'checkbox'){
        el.checked = false;
      }
    });
    $('#shipperStop').value='DROP30';
    $('#consStop').value='DROP30';
    $('#cargoWeight').value='0';
    if(stop2EnabledEl){
      stop2EnabledEl.checked = false;
      updateStop2Visibility();
    }
    $('#results').style.display='none';
  }

  $('#reset').addEventListener('click', ()=>{
    resetCalculations();

    if(window.hosHasActiveDay && window.hosHasActiveDay()){
      const alsoHos = confirm("Reset HOS clocks (Let’s Roll) as well? \nOK = reset clocks, Cancel = keep clocks running.");
      if(alsoHos && window.hosResetDay){
        window.hosResetDay(); // daily 10-hr reset, also feeds weekly history
      }
    }
  });

  // load recent trips on startup
  recentTrips = loadRecentTrips();
  renderRecentTrips();

  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js');
  }
})();

