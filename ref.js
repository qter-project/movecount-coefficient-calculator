export function algSpeed(
  sequence,
  ignoreErrors = false,
  ignoreauf = false,
  wristMult = 0.8,
  pushMult = 1.3,
  ringMult = 1.4,
  destabilize = 0.5,
  addRegrip = 1,
  double = 1.65,
  sesliceMult = 1.25,
  overWorkMult = 2.25,
  moveblock = 0.8,
  rotation = 3.5
) {
  const Wrist = {
    UNDER: -1,
    NEUTRAL: 0,
    OVER: 1,
    BROKEN: 2,
  };

  function finger() {
    return {
      t: -1, // last action time
      pos: "home", // current position
    };
  }

  function hand() {
    return {
      thumb: finger(),
      index: finger(),
      middle: finger(),
      ring: finger(),
      ohCool: -1,
    };
  }

  function lastFingerTime(hand) {
    return Math.max(hand.thumb.t, hand.index.t, hand.middle.t, hand.ring.t);
  }

  function test(splitSeq, lGrip, rGrip, speed) {
    const L = hand();
    const R = hand();

    let lWrist = lGrip;
    let rWrist = rGrip;
    let grip = 1;
    let udgrip = -1;
    let prevSpeed = null;
    let firstMoveSpeed = null;

    function overwork(f, preferred, penalty = overWorkMult) {
      if (f.pos !== preferred) {
        const delta = speed - f.t;
        if (delta < penalty) {
          return penalty - delta;
        }
      }
      return 0;
    }
    for (let j = 0; j < splitSeq.length; j++) {
      let move = splitSeq[j];
      let normalMove = move.toUpperCase();
      let prevMove = (j == 0 ? " " : splitSeq[j - 1]).toUpperCase();
      if (prevSpeed !== null) {
        firstMoveSpeed = speed;
        speed = prevSpeed;
      }
      if (j < splitSeq.length - 1) {
        if (
          (move[0] == "U" && splitSeq[j + 1][0] == "D") ||
          (move[0] == "D" && splitSeq[j + 1][0] == "U")
        ) {
          prevSpeed = speed;
        }
      }
      switch (normalMove) {
        case "R'":
          if (rWrist == 2) {
            rWrist = 0;
          } else if (rWrist > -1 && !(lWrist >= 1 && rWrist <= 0)) {
            rWrist--;
          } else {
            return [
              j,
              speed,
              lWrist,
              rWrist - 1,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          speed += wristMult;
          break;
        case "R":
          if (rWrist < 2 && !(lWrist <= -1 && rWrist >= 0)) {
            rWrist++;
          } else {
            return [
              j,
              speed,
              lWrist,
              rWrist + 1,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          speed += wristMult;
          break;
        case "R2":
          if (rWrist >= 1 && lWrist < 1) {
            rWrist = -1;
          } else if (lWrist > -1) {
            rWrist += 2;
          } else {
            return [
              j,
              speed,
              lWrist,
              rWrist > 0 ? rWrist - 2 : rWrist + 2,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          speed += double * wristMult;
          break;
        case "U":
          if (
            rWrist == 0 &&
            (R.thumb.t + overWorkMult <= speed || R.thumb.pos != "top") &&
            R.index.pos != "m"
          ) {
            if (overwork(R.index, "home") <= overwork(R.middle, "home")) {
              speed += overwork(R.index, "home");
              speed += 1;
              R.index.t = speed;
              R.index.pos = "uflick";
            } else {
              speed += overwork(R.middle, "home");
              speed += 1;
              R.index.t = speed;
              R.index.pos = "uflick";
              R.middle.t = speed;
              R.middle.pos = "uflick";
            }
          } else if (rWrist == 1 && lWrist == 0) {
            speed += overwork(L.index, "uflick");
            if (prevMove == "B'") {
              speed += moveblock + pushMult;
            } else if (prevMove[0] == "B'") {
              speed += moveblock * 0.5 + pushMult;
            } else {
              speed += pushMult;
            }
            L.index.t = speed;
            L.index.pos = "home";
          } else if (lWrist == 0 && prevMove[0] != "F" && prevMove[0] != "B") {
            if (L.index.pos == "uflick") {
              speed += overwork(L.index, "eido", 0.75 * overWorkMult);
              speed = Math.max(speed, L.ohCool + 2.5);
            } else {
              speed += overwork(L.index, "eido", 1.25 * overWorkMult);
            }
            speed += 1.15 * pushMult;
            L.index.t = speed;
            L.index.pos = "uflick";
            L.ohCool = speed;
          } else {
            return [
              j,
              speed,
              lWrist,
              rWrist,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          break;
        case "U'":
          if (
            lWrist == 0 &&
            (L.thumb.t + overWorkMult <= speed || L.thumb.pos != "top") &&
            L.index.pos != "m"
          ) {
            if (overwork(L.index, "home") <= overwork(L.middle, "home")) {
              speed += overwork(L.index, "home");
              speed += 1;
              L.index.t = speed;
              L.index.pos = "uflick";
            } else {
              speed += overwork(L.middle, "home");
              speed += 1;
              L.index.t = speed;
              L.index.pos = "uflick";
              L.middle.t = speed;
              L.middle.pos = "uflick";
            }
          } else if (lWrist == 1 && rWrist == 0) {
            speed += overwork(R.index, "uflick");
            if (prevMove == "B") {
              speed += moveblock + pushMult;
            } else if (prevMove[0] == "B'") {
              speed += moveblock * 0.5 + pushMult;
            } else {
              speed += pushMult;
            }
            R.index.t = speed;
            R.index.pos = "home";
          } else if (rWrist == 0 && prevMove[0] != "F" && prevMove[0] != "B") {
            if (R.index.pos == "uflick") {
              speed += overwork(R.index, "eido", 0.75 * overWorkMult);
              speed = Math.max(speed, R.ohCool + 2.5);
            } else {
              speed += overwork(R.index, "eido", 1.25 * overWorkMult);
            }
            speed += 1.15 * pushMult;
            R.index.t = speed;
            R.index.pos = "uflick";
            R.ohCool = speed;
          } else {
            return [
              j,
              speed,
              lWrist,
              rWrist,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          break;
        case "U2":
          if (
            rWrist == 0 &&
            (L.index.pos == "m" ||
              lWrist != 0 ||
              Math.max(
                overwork(R.index, "home"),
                overwork(R.middle, "home"),
                overwork(R.ring, "u2grip")
              ) <=
                Math.max(
                  overwork(L.index, "home"),
                  overwork(L.middle, "home"),
                  overwork(L.ring, "u2grip")
                ))
          ) {
            speed += overwork(R.index, "home");
            speed += overwork(R.middle, "home");
            speed += overwork(R.ring, "u2grip", moveblock * overWorkMult);
            speed += double;
            R.index.t = speed;
            R.index.pos = "uflick";
            R.middle.t = speed;
            R.middle.pos = "uflick";
          } else if (lWrist == 0) {
            speed += overwork(L.index, "home");
            speed += overwork(L.middle, "home");
            speed += overwork(L.ring, "u2grip", moveblock * overWorkMult);
            speed += double;
            L.index.t = speed;
            L.index.pos = "uflick";
            L.middle.t = speed;
            L.middle.pos = "uflick";
          } else {
            return [
              j,
              speed,
              lWrist,
              rWrist,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          break;
        case "D":
          if (
            lWrist == 0 &&
            (rWrist != 0 ||
              Math.max(overwork(L.ring, "home"), overwork(L.middle, "home")) <=
                Math.max(
                  overwork(R.ring, "dflick"),
                  overwork(R.middle, "home")
                ))
          ) {
            speed += overwork(L.ring, "home");
            speed += overwork(L.middle, "home");
            if (prevMove[0] == "B") {
              speed += moveblock * 0.5 + ringMult;
            } else {
              speed += ringMult;
            }
            L.ring.t = speed;
            L.ring.pos = "dflick";
          } else if (rWrist == 0 && prevMove[0] != "B") {
            speed += overwork(R.ring, "dflick");
            speed += overwork(R.middle, "home");
            speed += ringMult * pushMult;
            R.ring.t = speed;
            R.ring.pos = "home";
          } else {
            return [
              j,
              speed,
              lWrist,
              rWrist,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          break;
        case "D'":
          if (
            rWrist == 0 &&
            (lWrist != 0 ||
              Math.max(overwork(R.ring, "home"), overwork(R.middle, "home")) <=
                Math.max(
                  overwork(L.ring, "dflick"),
                  overwork(L.middle, "home")
                ))
          ) {
            speed += overwork(R.ring, "home");
            speed += overwork(R.middle, "home");
            if (prevMove[0] == "B") {
              speed += moveblock * 0.5 + ringMult;
            } else {
              speed += ringMult;
            }
            R.ring.t = speed;
            R.ring.pos = "dflick";
          } else if (lWrist == 0 && prevMove[0] != "B") {
            speed += overwork(L.ring, "dflick");
            speed += overwork(L.middle, "home");
            speed += ringMult * pushMult;
            L.ring.t = speed;
            L.ring.pos = "home";
          } else {
            return [
              j,
              speed,
              lWrist,
              rWrist,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          break;
        case "D2":
          if (
            rWrist == 0 &&
            (lWrist != 0 ||
              Math.max(overwork(R.middle, "home"), overwork(R.ring, "home")) <=
                Math.max(overwork(L.middle, "home"), overwork(L.ring, "home")))
          ) {
            speed += overwork(R.middle, "home");
            speed += overwork(R.ring, "home");
            if (prevMove[0] == "B") {
              speed += moveblock * 0.5 + double * ringMult;
            } else {
              speed += double * ringMult;
            }
            R.ring.t = speed;
            R.ring.pos = "dflick";
          } else if (lWrist == 0) {
            speed += overwork(L.middle, "home");
            speed += overwork(L.ring, "home");
            if (prevMove[0] == "B") {
              speed += moveblock * 0.5 + double * ringMult;
            } else {
              speed += double * ringMult;
            }
            L.ring.t = speed;
            L.ring.pos = "dflick";
          } else {
            return [
              j,
              speed,
              lWrist,
              rWrist,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          break;
        case "F":
          if (rWrist == -1) {
            speed += overwork(R.index, "home");
            speed += 1;
            R.index.t = speed;
            R.index.pos = "uflick";
          } else if (lWrist == 1 && move != "f") {
            speed += overwork(L.ring, "home");
            if (prevMove[0] == "D") {
              speed += moveblock * 0.5 + ringMult;
            } else {
              speed += 1;
            }
            L.ring.t = speed;
            L.ring.pos = "dflick";
          } else if (rWrist == 1 && prevMove[0] != "D" && move != "f") {
            speed += overwork(R.ring, "dflick");
            speed += ringMult * pushMult;
            R.ring.t = speed;
            R.ring.pos = "home";
          } else if (
            lWrist == -1 &&
            rWrist == 0 &&
            overwork(R.index, "uflick") == 0
          ) {
            speed += 1;
            R.index.t = speed;
            R.index.pos = "fflick";
          } else if (
            lWrist == -1 &&
            overwork(L.index, "uflick") == 0 &&
            prevMove[0] != "U"
          ) {
            speed += pushMult;
            L.index.t = speed;
            L.index.pos = "home";
          } else if (lWrist == -1 && grip == -1) {
            speed += overwork(L.thumb, "top", 0.9 * overWorkMult);
            speed += overwork(L.index, "top");
            if (prevMove[0] == "D") {
              speed += 1.8;
            } else {
              speed += 1;
            }
            lWrist++;
            L.thumb.t = speed;
            L.thumb.pos = "leftu";
            L.index.t = speed;
            L.index.pos = "top";
          } else if (lWrist == 0 && grip == -1) {
            speed += overwork(L.thumb, "bottom");
            speed += overwork(L.index, "top");
            if (prevMove[0] == "D") {
              speed += 2.05;
            } else {
              speed += 1.25;
            }
            L.thumb.t = speed;
            L.thumb.pos = "top";
            L.index.t = speed;
            L.index.pos = "top";
          } else if (rWrist == 0 && lWrist == 0 && move == "f") {
            speed += overwork(R.index, "uflick");
            speed += overwork(R.middle, "home");
            speed += 1;
            R.index.t = speed;
            R.index.pos = "fflick";
          } else if (j == 0 && rWrist == 0 && lWrist == 0) {
            speed += overwork(R.thumb, "top");
            speed += 1;
            R.thumb.t = speed;
            R.thumb.pos = "rdown";
            R.middle.t = speed;
            R.middle.pos = "uflick";
          } else {
            return [
              j,
              speed,
              lWrist,
              rWrist,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          break;
        case "F'":
          if (lWrist == -1) {
            speed += overwork(L.index, "home");
            speed += 1;
            L.index.t = speed;
            L.index.pos = "uflick";
          } else if (rWrist == 1 && move != "f") {
            speed += overwork(R.ring, "home");
            if (prevMove[0] == "D") {
              speed += moveblock * 0.5 + ringMult;
            } else {
              speed += 1;
            }
            R.ring.t = speed;
            R.ring.pos = "dflick";
          } else if (lWrist == 1 && prevMove[0] != "D" && move != "f") {
            speed += overwork(L.ring, "dflick");
            speed += ringMult * pushMult;
            L.ring.t = speed;
            L.ring.pos = "home";
          } else if (
            rWrist == -1 &&
            lWrist == 0 &&
            overwork(L.index, "uflick") == 0
          ) {
            speed += 1;
            L.index.t = speed;
            L.index.pos = "fflick";
          } else if (
            rWrist == -1 &&
            overwork(R.index, "uflick") == 0 &&
            prevMove[0] != "U"
          ) {
            speed += pushMult;
            R.index.t = speed;
            R.index.pos = "home";
          } else if (rWrist == -1 && grip == 1) {
            speed += overwork(R.thumb, "top", 0.9 * overWorkMult);
            speed += overwork(R.index, "top");
            if (prevMove[0] == "D") {
              speed += 1.8;
            } else {
              speed += 1;
            }
            rWrist++;
            R.thumb.t = speed;
            R.thumb.pos = "rightu";
            R.index.t = speed;
            R.index.pos = "top";
          } else if (rWrist == 0 && grip == 1) {
            speed += overwork(R.thumb, "bottom");
            speed += overwork(R.index, "top");
            if (prevMove[0] == "D") {
              speed += 2.05;
            } else {
              speed += 1.25;
            }
            R.thumb.t = speed;
            R.thumb.pos = "top";
            R.index.t = speed;
            R.index.pos = "top";
          } else if (lWrist == 0 && rWrist == 0 && move == "f'") {
            speed += overwork(L.index, "uflick");
            speed += overwork(L.middle, "home");
            speed += 1;
            L.index.t = speed;
            L.index.pos = "fflick";
          } else if (j == 0 && rWrist == 0 && lWrist == 0) {
            speed += overwork(L.thumb, "top");
            speed += 1;
            L.thumb.t = speed;
            L.thumb.pos = "rdown";
            L.middle.t = speed;
            L.middle.pos = "uflick";
          } else {
            return [
              j,
              speed,
              lWrist,
              rWrist,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          break;
        case "F2":
          if (
            rWrist == -1 &&
            (lWrist != -1 ||
              Math.max(
                overwork(R.index, "home"),
                overwork(R.middle, "home"),
                overwork(R.ring, "u2grip")
              ) <=
                Math.max(
                  overwork(L.index, "home"),
                  overwork(L.middle, "home"),
                  overwork(L.ring, "u2grip")
                ))
          ) {
            speed += overwork(R.index, "home");
            speed += overwork(R.middle, "home");
            speed += overwork(R.ring, "u2grip");
            speed += double;
            R.index.t = speed;
            R.index.pos = "uflick";
            R.middle.t = speed;
            R.middle.pos = "uflick";
          } else if (lWrist == -1) {
            speed += overwork(L.index, "home");
            speed += overwork(L.middle, "home");
            speed += overwork(L.ring, "u2grip");
            speed += double;
            L.index.t = speed;
            L.index.pos = "uflick";
            L.middle.t = speed;
            L.middle.pos = "uflick";
          } else if (
            rWrist == 1 &&
            (lWrist != 1 ||
              Math.max(overwork(R.middle, "home"), overwork(R.ring, "home")) <=
                Math.max(overwork(L.middle, "home"), overwork(L.ring, "home")))
          ) {
            speed += overwork(R.middle, "home");
            speed += overwork(R.ring, "home");
            if (prevMove[0] == "D") {
              speed += double * ringMult + moveblock * 0.5;
            } else {
              speed += double * ringMult;
            }
            R.ring.t = speed;
            R.ring.pos = "dflick";
          } else if (lWrist == 1) {
            speed += overwork(L.middle, "home");
            speed += overwork(L.ring, "home");
            if (prevMove[0] == "D") {
              speed += double * ringMult + moveblock * 0.5;
            } else {
              speed += double * ringMult;
            }
            L.ring.t = speed;
            L.ring.pos = "dflick";
          } else {
            return [
              j,
              speed,
              lWrist,
              rWrist,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          break;
        case "L":
          if (lWrist == 2) {
            lWrist = 0;
          } else if (lWrist > -1 && !(rWrist >= 1 && lWrist <= 0)) {
            lWrist--;
          } else {
            return [
              j,
              speed,
              lWrist - 1,
              rWrist,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          speed += wristMult;
          break;
        case "L'":
          if (lWrist < 2 && !(rWrist <= -1 && lWrist >= 0)) {
            lWrist++;
          } else {
            return [
              j,
              speed,
              lWrist + 1,
              rWrist,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          speed += wristMult;
          break;
        case "L2":
          if (lWrist >= 1 && rWrist < 1) {
            lWrist = -1;
          } else if (rWrist > -1) {
            lWrist += 2;
          } else {
            return [
              j,
              speed,
              lWrist > 0 ? lWrist - 2 : lWrist + 2,
              rWrist,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          speed += double * wristMult;
          break;
        case "B":
          if (rWrist == 1) {
            speed += overwork(R.index, "home");
            speed += 1;
            R.index.t = speed;
            R.index.pos = "uflick";
          } else if (lWrist == -1) {
            speed += overwork(L.ring, "home");
            speed += overwork(L.middle, "home");
            if (prevMove[0] == "U") {
              speed += moveblock * 0.5 + ringMult;
            } else {
              speed += ringMult;
            }
            L.ring.t = speed;
            L.ring.pos = "dflick";
          } else if (lWrist == 1 && prevMove[0] != "U" && prevMove[0] != "D") {
            if (L.index.pos == "uflick") {
              speed += overwork(L.index, "eido", 0.75 * overWorkMult);
              speed = Math.max(speed, L.ohCool + 2.5);
            } else {
              speed += overwork(L.index, "eido", 1.25 * overWorkMult);
            }
            speed += 1.15 * pushMult;
            L.index.t = speed;
            L.index.pos = "uflick";
            L.ohCool = speed;
          } else if (lWrist == 0 && (rWrist == 1 || rWrist == -1)) {
            speed += overwork(L.index, "top", 0.9 * overWorkMult);
            if (prevMove[0] == "U") {
              speed += 1.45;
            } else {
              speed += 1;
            }
            L.index.t = speed;
            L.index.pos = "leftdb";
          } else if (rWrist == -1 && prevMove[0] != "U") {
            speed += overwork(R.ring, "dflick");
            speed += overwork(R.middle, "home");
            speed += ringMult * pushMult;
            R.ring.t = speed;
            R.ring.pos = "home";
          } else {
            return [
              j,
              speed,
              lWrist,
              rWrist,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          break;
        case "B'":
          if (lWrist == 1) {
            speed += overwork(L.index, "home");
            speed += 1;
            L.index.t = speed;
            L.index.pos = "uflick";
          } else if (rWrist == -1) {
            speed += overwork(R.ring, "home");
            speed += overwork(R.middle, "home");
            if (prevMove[0] == "U") {
              speed += moveblock * 0.5 + ringMult;
            } else {
              speed += ringMult;
            }
            R.ring.t = speed;
            R.ring.pos = "dflick";
          } else if (rWrist == 1 && prevMove[0] != "U" && prevMove[0] != "D") {
            if (R.index.pos == "uflick") {
              speed += overwork(R.index, "eido", 0.75 * overWorkMult);
              speed = Math.max(speed, R.ohCool + 2.5);
            } else {
              speed += overwork(R.index, "eido", 1.25 * overWorkMult);
            }
            speed += 1.15 * pushMult;
            R.index.t = speed;
            R.index.pos = "uflick";
            R.ohCool = speed;
          } else if (rWrist == 0 && (lWrist == 1 || lWrist == -1)) {
            speed += overwork(R.index, "top", 0.9 * overWorkMult);
            if (prevMove[0] == "U") {
              speed += 1.45;
            } else {
              speed += 1;
            }
            R.index.t = speed;
            R.index.pos = "rightdb";
          } else if (lWrist == -1 && prevMove[0] != "U") {
            speed += overwork(L.ring, "dflick");
            speed += overwork(L.middle, "home");
            speed += ringMult * pushMult;
            L.ring.t = speed;
            L.ring.pos = "home";
          } else {
            return [
              j,
              speed,
              lWrist,
              rWrist,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          break;
        case "B2":
          if (
            rWrist == 1 &&
            (lWrist != 1 ||
              Math.max(
                overwork(R.index, "home"),
                overwork(R.middle, "home"),
                overwork(R.ring, "u2grip")
              ) <=
                Math.max(
                  overwork(L.index, "home"),
                  overwork(L.middle, "home"),
                  overwork(L.ring, "u2grip")
                ))
          ) {
            speed += overwork(R.index, "home");
            speed += overwork(R.middle, "home");
            speed += overwork(R.ring, "u2grip");
            speed += double;
            R.index.t = speed;
            R.index.pos = "uflick";
            R.middle.t = speed;
            R.middle.pos = "uflick";
          } else if (lWrist == 1) {
            speed += overwork(L.index, "home");
            speed += overwork(L.middle, "home");
            speed += overwork(L.ring, "u2grip");
            speed += double;
            L.index.t = speed;
            L.index.pos = "uflick";
            L.middle.t = speed;
            L.middle.pos = "uflick";
          } else if (
            lWrist == -1 &&
            (rWrist != -1 ||
              Math.max(overwork(R.middle, "home"), overwork(R.ring, "home")) >
                Math.max(overwork(L.middle, "home"), overwork(L.ring, "home")))
          ) {
            speed += overwork(L.middle, "home");
            speed += overwork(L.ring, "home");
            if (prevMove[0] == "U") {
              speed += moveblock * 0.5 + double * ringMult;
            } else {
              speed += double * ringMult;
            }
            L.ring.t = speed;
            L.ring.pos = "dflick";
          } else if (rWrist == -1) {
            speed += overwork(R.middle, "home");
            speed += overwork(R.ring, "home");
            if (prevMove[0] == "U") {
              speed += moveblock * 0.5 + double * ringMult;
            } else {
              speed += double * ringMult;
            }
            R.ring.t = speed;
            R.ring.pos = "dflick";
          } else {
            return [
              j,
              speed,
              lWrist,
              rWrist,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          break;
        case "S":
          if (
            rWrist == 0 &&
            (lWrist != 0 ||
              overwork(R.index, "top", 1.25 * overWorkMult) <=
                (moveblock * 0.5 + pushMult - 1) * sesliceMult)
          ) {
            speed += overwork(R.index, "top", 1.25 * overWorkMult);
            speed += sesliceMult;
            R.index.t = speed;
            R.index.pos = "sflick";
          } else if (lWrist == 0 && rWrist == -1) {
            speed += overwork(R.index, "home", 1.25 * overWorkMult);
            speed += overwork(R.thumb, "top", 1.25 * overWorkMult);
            speed += overwork(R.middle, "home", 1.25 * overWorkMult);
            speed += sesliceMult;
            R.thumb.t = speed;
            R.thumb.pos = "top";
            R.middle.t = speed;
            R.middle.pos = "eflick";
          } else if (
            lWrist == 0 &&
            (rWrist == 0 ||
              (rWrist == 1 && (prevMove == "R" || prevMove == "L")))
          ) {
            speed += overwork(L.index, "uflick", 1.25 * overWorkMult);
            if (prevMove[0] == "U") {
              speed += moveblock * 0.5 + pushMult * sesliceMult;
            } else {
              speed += pushMult * sesliceMult;
            }
            L.index.t = speed;
            L.index.pos = "top";
          } else {
            return [
              j,
              speed,
              lWrist,
              rWrist,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          break;
        case "S'":
          if (
            lWrist == 0 &&
            (rWrist != 0 ||
              overwork(L.index, "top", 1.25 * overWorkMult) <=
                (moveblock * 0.5 + pushMult - 1) * sesliceMult)
          ) {
            speed += overwork(L.index, "top", 1.25 * overWorkMult);
            speed += sesliceMult;
            L.index.t = speed;
            L.index.pos = "sflick";
          } else if (rWrist == 0 && lWrist == -1) {
            speed += overwork(L.index, "home", 1.25 * overWorkMult);
            speed += overwork(L.thumb, "bottom", 1.25 * overWorkMult);
            speed += overwork(L.middle, "home", 1.25 * overWorkMult);
            speed += sesliceMult;
            L.thumb.t = speed;
            L.thumb.pos = "top";
            L.middle.t = speed;
            L.middle.pos = "eflick";
          } else if (
            rWrist == 0 &&
            (lWrist == 0 ||
              (lWrist == 1 && (prevMove == "R" || prevMove == "L")))
          ) {
            speed += overwork(R.index, "uflick", 1.25 * overWorkMult);
            if (prevMove[0] == "U") {
              speed += moveblock * 0.5 + pushMult * sesliceMult;
            } else {
              speed += pushMult * sesliceMult;
            }
            R.index.t = speed;
            R.index.pos = "top";
          } else {
            return [
              j,
              speed,
              lWrist,
              rWrist,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          break;
        case "S2":
          if ((rWrist == -1 || rWrist == 1) && lWrist == 0) {
            speed += overwork(R.thumb, "home");
            speed += overwork(R.index, "home");
            speed += overwork(R.middle, "home");
            speed += overwork(R.ring, "u2grip");
            speed += sesliceMult * double;
            R.middle.t = speed;
            R.middle.pos = "e";
            R.index.t = speed;
            R.index.pos = "e";
          } else if ((lWrist == -1 || lWrist == 1) && rWrist == 0) {
            speed += overwork(L.thumb, "home");
            speed += overwork(L.index, "home");
            speed += overwork(L.middle, "home");
            speed += overwork(L.ring, "u2grip");
            speed += sesliceMult * double;
            L.middle.t = speed;
            L.middle.pos = "e";
            L.index.t = speed;
            L.index.pos = "e";
          } else {
            return [
              j,
              speed,
              lWrist,
              rWrist,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          break;
        case "E":
          if ((rWrist == 1 || rWrist == -1) && lWrist == 0) {
            speed += overwork(L.index, "home");
            speed += sesliceMult;
            L.index.t = speed;
            L.index.pos = "e";
          } else if (
            (lWrist == 1 || lWrist == -1) &&
            rWrist == 0 &&
            prevMove[0] != "B"
          ) {
            speed += overwork(R.index, "e");
            speed += sesliceMult * pushMult;
            R.index.t = speed;
            R.index.pos = "home";
          } else {
            return [
              j,
              speed,
              lWrist,
              rWrist,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          break;
        case "E'":
          if ((lWrist == 1 || lWrist == -1) && rWrist == 0) {
            speed += overwork(R.index, "home");
            speed += sesliceMult;
            R.index.t = speed;
            R.index.pos = "e";
          } else if (
            (rWrist == 1 || rWrist == -1) &&
            lWrist == 0 &&
            prevMove[0] != "B"
          ) {
            speed += overwork(L.index, "e");
            speed += sesliceMult * pushMult;
            L.index.t = speed;
            L.index.pos = "home";
          } else {
            return [
              j,
              speed,
              lWrist,
              rWrist,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          break;
        case "E2":
          if ((lWrist == 1 || lWrist == -1) && rWrist == 0) {
            speed += overwork(R.index, "home");
            speed += overwork(R.middle, "home");
            speed += overwork(R.ring, "u2grip");
            speed += sesliceMult * double;
            R.index.t = speed;
            R.index.pos = "e";
            R.middle.t = speed;
            R.middle.pos = "e";
          } else if ((rWrist == 1 || rWrist == -1) && lWrist == 0) {
            speed += overwork(L.index, "home");
            speed += overwork(L.middle, "home");
            speed += overwork(L.ring, "u2grip");
            speed += sesliceMult * double;
            L.index.t = speed;
            L.index.pos = "e";
            L.middle.t = speed;
            L.middle.pos = "e";
          } else {
            return [
              j,
              speed,
              lWrist,
              rWrist,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          break;
        case "M'":
          if (lWrist == 0) {
            speed += overwork(L.thumb, "home");
            speed += overwork(L.index, "m");
            speed += overwork(L.middle, "m");
            speed += overwork(L.ring, "m");
            if (prevMove[0] == "B") {
              speed += 1.8;
            } else {
              speed += 1;
            }
            L.thumb.t = speed;
            L.thumb.pos = "home";
            L.index.t = speed;
            L.index.pos = "m";
            L.middle.t = speed;
            L.middle.pos = "mflick";
            L.ring.t = speed;
            L.ring.pos = "m";
          } else {
            return [
              j,
              speed,
              lWrist,
              rWrist,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          break;
        case "M":
          if (lWrist == 0 && prevMove[0] != "B") {
            speed += overwork(L.thumb, "home");
            speed += overwork(L.index, "m");
            speed += overwork(L.middle, "mflick", 1.25 * overWorkMult);
            speed += overwork(L.ring, "m");
            speed += pushMult;
            L.thumb.t = speed;
            L.thumb.pos = "home";
            L.index.t = speed;
            L.index.pos = "m";
            L.middle.t = speed;
            L.middle.pos = "m";
            L.ring.t = speed;
            L.ring.pos = "m";
          } else {
            return [
              j,
              speed,
              lWrist,
              rWrist,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          break;
        case "M2":
          if (lWrist == 0) {
            speed += overwork(L.thumb, "home");
            speed += overwork(L.index, "m");
            speed += overwork(L.middle, "m");
            speed += overwork(L.ring, "m");
            if (prevMove[0] == "B") {
              speed += moveblock + double;
            } else {
              speed += double;
            }
            L.thumb.t = speed;
            L.thumb.pos = "home";
            L.index.t = speed;
            L.index.pos = "m";
            L.middle.t = speed;
            L.middle.pos = "mflick";
            L.ring.t = speed;
            L.ring.pos = "m";
          } else {
            return [
              j,
              speed,
              lWrist,
              rWrist,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          break;
        case "X":
          lWrist += 1;
          rWrist += 1;
          if (lWrist > 1 || rWrist > 1) {
            return [
              j + 1,
              speed,
              lWrist,
              rWrist,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          break;
        case "X'":
          lWrist -= 1;
          rWrist -= 1;
          if (lWrist < -1 || rWrist < -1) {
            return [
              j + 1,
              speed,
              lWrist,
              rWrist,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          break;
        case "X2":
          if (lWrist >= 1 && rWrist >= 1) {
            lWrist -= 2;
            rWrist -= 2;
          } else if (lWrist <= -1 && rWrist <= -1) {
            lWrist += 2;
            rWrist += 2;
          } else if (lWrist + rWrist > 0) {
            return [
              j,
              speed,
              lWrist - 2,
              rWrist - 2,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          } else {
            return [
              j,
              speed,
              lWrist + 2,
              rWrist + 2,
              lastFingerTime(L),
              lastFingerTime(R),
            ];
          }
          break;
        case "Y":
        case "Y'":
        case "Z":
        case "Z'":
          speed += rotation;
          return [j + 1, speed, 0, 0, lastFingerTime(L), lastFingerTime(R)];
          break;
        case "Y2":
        case "Z2":
          speed += rotation * double;
          return [j + 1, speed, 0, 0, lastFingerTime(L), lastFingerTime(R)];
          break;
        default:
          return "Unknown move: " + move;
      }
      if (firstMoveSpeed !== null) {
        speed = Math.max(firstMoveSpeed, speed) + 0.5;
        prevSpeed = null;
        firstMoveSpeed = null;
      }
      if ((move[0] == "R" || move[0] == "l") && grip == -1) {
        grip = 1;
        speed += 0.65;
      } else if ((move[0] == "r" || move[0] == "L") && grip == 1) {
        grip = -1;
        speed += 0.65;
      }
      if (move[0] == "d" && udgrip == -1) {
        udgrip = 1;
        speed += 2.25;
      } else if ((move[0] == "U" || move[0] == "u") && udgrip == 1) {
        udgrip = -1;
        speed += 2.25;
      }
      if (j >= 2) {
        if (
          (normalMove == "R" &&
            move == splitSeq[j - 2] &&
            splitSeq[j - 1].toUpperCase() == "U'") ||
          (normalMove == "R'" &&
            move == splitSeq[j - 2] &&
            splitSeq[j - 1].toUpperCase() == "U")
        ) {
          speed -= 0.5;
        } else if (
          (normalMove == "R" &&
            move == splitSeq[j - 2] &&
            splitSeq[j - 1].toUpperCase() == "D'" &&
            rWrist == 1) ||
          (normalMove == "R'" &&
            move == splitSeq[j - 2] &&
            splitSeq[j - 1].toUpperCase() == "D")
        ) {
          speed -= 0.3;
        }
      }
      if (normalMove == "U" && (lWrist == -1 || rWrist == -1)) {
        speed += destabilize;
      }
      if (normalMove == "B" && (lWrist == 0 || rWrist == 0)) {
        speed += destabilize;
      }
      if (normalMove == "D" && (lWrist == 1 || rWrist == 1)) {
        speed += destabilize;
      }
      if (
        normalMove == "S" &&
        (lWrist == 1 || rWrist == 1 || lWrist == -1 || rWrist == -1)
      ) {
        speed += destabilize;
      }
      if (normalMove == "E" && (lWrist == 0 || rWrist == 0)) {
        speed += destabilize;
      }
    }
    return [-1, speed, lGrip, rGrip];
  }
  let splitSeq = sequence.split(" ");
  let trueSplitSeq = [];
  for (let i = 0; i < splitSeq.length; i++) {
    if (ignoreErrors) {
      if (
        [
          "r",
          "r2",
          "r'",
          "u",
          "u'",
          "u2",
          "f",
          "f2",
          "f'",
          "d",
          "d2",
          "d'",
          "l",
          "l2",
          "l'",
          "b",
          "b2",
          "b'",
          "m",
          "m2",
          "m'",
          "s",
          "s2",
          "s'",
          "e",
          "e2",
          "e'",
          "x",
          "x'",
          "x2",
          "y",
          "y'",
          "y2",
          "z",
          "z'",
          "z2",
        ].includes(splitSeq[i].toLowerCase())
      ) {
        trueSplitSeq.push(splitSeq[i]);
      }
    } else {
      if (splitSeq[i] != "") {
        trueSplitSeq.push(splitSeq[i]);
      }
    }
  }
  splitSeq = trueSplitSeq.slice();
  if (ignoreauf) {
    if (splitSeq.length >= 1) {
      if (splitSeq[0][0] == "U") {
        splitSeq.shift();
      } else if (splitSeq.length >= 2) {
        if (splitSeq[0][0].toLowerCase() == "d" && splitSeq[1][0] == "U") {
          splitSeq[1] = splitSeq[0];
          splitSeq.shift();
        }
      }
    }
    if (splitSeq.length >= 1) {
      if (splitSeq[splitSeq.length - 1][0] == "U") {
        splitSeq.pop();
      } else if (splitSeq.length >= 2) {
        if (
          splitSeq[splitSeq.length - 1][0].toLowerCase() == "d" &&
          splitSeq[splitSeq.length - 2][0] == "U"
        ) {
          splitSeq[splitSeq.length - 2] = splitSeq[splitSeq.length - 1];
          splitSeq.pop();
        }
      }
    }
  }

  let tests = [
    test(splitSeq, 0, 0, 0),
    test(splitSeq, 0, -1, 1 + addRegrip),
    test(splitSeq, 0, 1, 1 + addRegrip),
    test(splitSeq, -1, 0, 1 + addRegrip),
    test(splitSeq, 1, 0, 1 + addRegrip),
  ];

  while (true) {
    for (let i = 0; i < tests.length; i++) {
      if (tests[i][0] == "U") {
        // I have no idea what this code does
        return tests[i];
      }
    }
    let bestTest = tests[0];
    for (let i = 1; i < tests.length; i++) {
      let compTest = tests[i];
      if (
        compTest[0] == -1 &&
        (bestTest[0] != -1 || bestTest[1] > compTest[1])
      ) {
        bestTest = compTest;
      } else if (compTest[0] > bestTest[0] && bestTest[0] != -1) {
        bestTest = compTest;
      } else if (
        compTest[0] == bestTest[0] &&
        compTest[1] < bestTest[1] &&
        bestTest[0] != -1
      ) {
        bestTest = compTest;
      }
    }
    if (bestTest[0] == -1) {
      return Math.round(bestTest[1] * 10) / 10;
    }
    tests = [];

    let prevMoveType = bestTest[0] >= 1 ? splitSeq[bestTest[0] - 1][0] : " ";
    let prev2Type = bestTest[0] >= 2 ? splitSeq[bestTest[0] - 2][0] : " ";
    let doubleRegrip = false;

    if (
      (bestTest[2] > 1 || bestTest[2] < -1) &&
      (bestTest[3] > 1 || bestTest[3] < -1)
    ) {
      doubleRegrip = true;
    }

    for (let leftWrist = -1; leftWrist < 2; leftWrist++) {
      for (let rightWrist = -1; rightWrist < 2; rightWrist++) {
        let leftMatch = bestTest[2] == leftWrist;
        let rightMatch = bestTest[3] == rightWrist;
        if (["X", "x", "Y", "y", "Z", "z"].includes(prevMoveType)) {
          // rotation handling
          tests.push(
            test(
              splitSeq.slice(bestTest[0]),
              leftWrist,
              rightWrist,
              bestTest[1]
            )
          );
        } else {
          let penalty = doubleRegrip ? rotation * double : 2; // double regrips should be exceedingly rare, so penalty would almost always equal 2
          let rMoveLatency;
          if (
            prevMoveType == "R" ||
            prev2Type == "R" ||
            prevMoveType == "r" ||
            prev2Type == "r"
          ) {
            rMoveLatency = 1;
          } else {
            rMoveLatency = 0;
          }
          let lMoveLatency;
          if (
            prevMoveType == "L" ||
            prev2Type == "L" ||
            prevMoveType == "l" ||
            prev2Type == "l"
          ) {
            lMoveLatency = 1;
          } else {
            lMoveLatency = 0;
          }
          if (leftMatch || doubleRegrip) {
            let rHandLatency = Math.max(0, 2 - (bestTest[1] - bestTest[5])); // time between last right hand motion and now
            penalty = Math.max(rHandLatency, rMoveLatency, lMoveLatency * 2);
            tests.push(
              test(
                splitSeq.slice(bestTest[0]),
                leftWrist,
                rightWrist,
                bestTest[1] + penalty + addRegrip
              )
            );
          } else if (rightMatch || doubleRegrip) {
            let lHandLatency = Math.max(0, 2 - (bestTest[1] - bestTest[4])); // time between last right hand motion and now
            penalty = Math.max(lHandLatency, lMoveLatency, rMoveLatency * 2);
            tests.push(
              test(
                splitSeq.slice(bestTest[0]),
                leftWrist,
                rightWrist,
                bestTest[1] + penalty + addRegrip
              )
            );
          }
        }
      }
    }
    splitSeq = splitSeq.slice(bestTest[0]);
  }
}
