// all possible wrist positions
const Wrist = {
  UNDER: -1,
  NEUTRAL: 0,
  OVER: 1,
  // wtf does the broken state mean
  BROKEN: 2,
};

// ============================================================
// PHASE 1: Event Summary System
// ============================================================

// Creates an event summary accumulator for instrumented simulation
function makeSummary() {
  return {
    wristTurns: 0,
    wristDoubleTurns: 0,

    regrips: 0,
    doubleRegrips: 0,

    overworks: 0,
    overworkAmount: 0, // raw delta, before multiplier

    pushes: 0,
    ringFlicks: 0,

    destabilizes: 0,
    moveBlocks: 0,

    rotations: 0,

    fingerMoves: 0, // basic finger flicks
    doubleFingerMoves: 0, // U2 finger flicks
  };
}

// Helper functions for recording events (keeps branches readable)
function recordOverwork(summary, amount) {
  if (amount > 0) {
    summary.overworks++;
    summary.overworkAmount += amount;
  }
}

function recordPush(summary) {
  summary.pushes++;
}

function recordRingFlick(summary) {
  summary.ringFlicks++;
}

function recordDestabilize(summary) {
  summary.destabilizes++;
}

function recordMoveBlock(summary) {
  summary.moveBlocks++;
}

function recordWristTurn(summary) {
  summary.wristTurns++;
}

function recordWristDoubleTurn(summary) {
  summary.wristDoubleTurns++;
}

function recordFingerMove(summary) {
  summary.fingerMoves++;
}

function recordDoubleFingerMove(summary) {
  summary.doubleFingerMoves++;
}

function recordRegrip(summary) {
  summary.regrips++;
}

function recordDoubleRegrip(summary) {
  summary.doubleRegrips++;
}

function recordRotation(summary) {
  summary.rotations++;
}

// ============================================================
// PHASE 2: Cost Aggregation (pure math)
// ============================================================

// Collapses summary into final scalar cost
function aggregateCost(summary, c) {
  let cost = 0;

  cost += summary.wristTurns * c.wristMultiplier;
  cost += summary.wristDoubleTurns * c.wristMultiplier * c.double;

  cost += summary.regrips * c.addRegrip;
  cost += summary.doubleRegrips * c.addRegrip * c.double;

  cost += summary.overworkAmount * c.overWorkMultiplier;

  cost += summary.pushes * c.pushMultiplier;
  cost += summary.ringFlicks * c.ringFingerMultiplier;

  cost += summary.destabilizes * c.destabilizePenalty;
  cost += summary.moveBlocks * c.moveblockPenalty;

  cost += summary.rotations * c.rotation;

  cost += summary.fingerMoves * 1; // base finger move cost is 1
  cost += summary.doubleFingerMoves * c.double;

  return cost;
}

// initialize finger state
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

// gets the last finger time of a hand
function lastFingerTime(hand) {
  return Math.max(hand.thumb.t, hand.index.t, hand.middle.t, hand.ring.t);
}

function test(
  splitSeq,
  startingLeftGrip,
  startingRightGrip,
  speed,
  constants,
  summary = null
) {
  const leftHand = hand();
  const rightHand = hand();

  // If no summary provided, create one (for backward compatibility during migration)
  if (summary === null) {
    summary = makeSummary();
  }

  let leftWrist = startingLeftGrip;
  let rightWrist = startingRightGrip;

  let grip = 1;
  let udgrip = -1;

  let prevSpeed = null;
  let firstMoveSpeed = null;

  function overwork(f, preferred, penalty = constants.overWorkMultiplier) {
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
        if (rightWrist == Wrist.BROKEN) {
          rightWrist = Wrist.NEUTRAL;
        } else if (
          rightWrist > Wrist.UNDER &&
          !(leftWrist >= Wrist.OVER && rightWrist <= Wrist.NEUTRAL)
        ) {
          rightWrist--;
        } else {
          return [
            j,
            speed,
            leftWrist,
            rightWrist - 1,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        recordWristTurn(summary);
        speed += constants.wristMultiplier;
        break;
      case "R":
        if (
          rightWrist < Wrist.BROKEN &&
          !(leftWrist <= Wrist.UNDER && rightWrist >= Wrist.NEUTRAL)
        ) {
          rightWrist++;
        } else {
          return [
            j,
            speed,
            leftWrist,
            rightWrist + 1,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        recordWristTurn(summary);
        speed += constants.wristMultiplier;
        break;
      case "R2":
        if (rightWrist >= Wrist.OVER && leftWrist < Wrist.OVER) {
          rightWrist = Wrist.UNDER;
        } else if (leftWrist > Wrist.UNDER) {
          rightWrist += 2;
        } else {
          return [
            j,
            speed,
            leftWrist,
            rightWrist > Wrist.NEUTRAL ? rightWrist - 2 : rightWrist + 2,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        recordWristDoubleTurn(summary);
        speed += constants.double * constants.wristMultiplier;
        break;
      case "U":
        if (
          rightWrist == Wrist.NEUTRAL &&
          (rightHand.thumb.t + constants.overWorkMultiplier <= speed ||
            rightHand.thumb.pos != "top") &&
          rightHand.index.pos != "m"
        ) {
          if (
            overwork(rightHand.index, "home") <=
            overwork(rightHand.middle, "home")
          ) {
            const ow = overwork(rightHand.index, "home");
            recordOverwork(summary, ow);
            speed += ow;
            recordFingerMove(summary);
            speed += 1;
            rightHand.index.t = speed;
            rightHand.index.pos = "uflick";
          } else {
            const ow = overwork(rightHand.middle, "home");
            recordOverwork(summary, ow);
            speed += ow;
            recordFingerMove(summary);
            speed += 1;
            rightHand.index.t = speed;
            rightHand.index.pos = "uflick";
            rightHand.middle.t = speed;
            rightHand.middle.pos = "uflick";
          }
        } else if (rightWrist == Wrist.OVER && leftWrist == Wrist.NEUTRAL) {
          const ow = overwork(leftHand.index, "uflick");
          recordOverwork(summary, ow);
          speed += ow;
          if (prevMove == "B'") {
            recordMoveBlock(summary);
            speed += constants.moveblockPenalty;
            recordPush(summary);
            speed += constants.pushMultiplier;
          } else if (prevMove[0] == "B'") {
            recordMoveBlock(summary);
            speed += constants.moveblockPenalty * 0.5;
            recordPush(summary);
            speed += constants.pushMultiplier;
          } else {
            recordPush(summary);
            speed += constants.pushMultiplier;
          }
          leftHand.index.t = speed;
          leftHand.index.pos = "home";
        } else if (
          leftWrist == Wrist.NEUTRAL &&
          prevMove[0] != "F" &&
          prevMove[0] != "B"
        ) {
          if (leftHand.index.pos == "uflick") {
            const ow = overwork(
              leftHand.index,
              "eido",
              0.75 * constants.overWorkMultiplier
            );
            recordOverwork(summary, ow);
            speed += ow;
            speed = Math.max(speed, leftHand.ohCool + 2.5);
          } else {
            const ow = overwork(
              leftHand.index,
              "eido",
              1.25 * constants.overWorkMultiplier
            );
            recordOverwork(summary, ow);
            speed += ow;
          }
          recordPush(summary);
          speed += 1.15 * constants.pushMultiplier;
          leftHand.index.t = speed;
          leftHand.index.pos = "uflick";
          leftHand.ohCool = speed;
        } else {
          return [
            j,
            speed,
            leftWrist,
            rightWrist,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        break;
      case "U'":
        if (
          leftWrist == Wrist.NEUTRAL &&
          (leftHand.thumb.t + constants.overWorkMultiplier <= speed ||
            leftHand.thumb.pos != "top") &&
          leftHand.index.pos != "m"
        ) {
          if (
            overwork(leftHand.index, "home") <=
            overwork(leftHand.middle, "home")
          ) {
            const ow = overwork(leftHand.index, "home");
            recordOverwork(summary, ow);
            speed += ow;
            recordFingerMove(summary);
            speed += 1;
            leftHand.index.t = speed;
            leftHand.index.pos = "uflick";
          } else {
            const ow = overwork(leftHand.middle, "home");
            recordOverwork(summary, ow);
            speed += ow;
            recordFingerMove(summary);
            speed += 1;
            leftHand.index.t = speed;
            leftHand.index.pos = "uflick";
            leftHand.middle.t = speed;
            leftHand.middle.pos = "uflick";
          }
        } else if (leftWrist == Wrist.OVER && rightWrist == Wrist.NEUTRAL) {
          const ow = overwork(rightHand.index, "uflick");
          recordOverwork(summary, ow);
          speed += ow;
          if (prevMove == "B") {
            recordMoveBlock(summary);
            recordPush(summary);
            speed += constants.moveblockPenalty + constants.pushMultiplier;
          } else if (prevMove[0] == "B'") {
            recordMoveBlock(summary);
            recordPush(summary);
            speed +=
              constants.moveblockPenalty * 0.5 + constants.pushMultiplier;
          } else {
            recordPush(summary);
            speed += constants.pushMultiplier;
          }
          rightHand.index.t = speed;
          rightHand.index.pos = "home";
        } else if (
          rightWrist == Wrist.NEUTRAL &&
          prevMove[0] != "F" &&
          prevMove[0] != "B"
        ) {
          if (rightHand.index.pos == "uflick") {
            const ow = overwork(
              rightHand.index,
              "eido",
              0.75 * constants.overWorkMultiplier
            );
            recordOverwork(summary, ow);
            speed += ow;
            speed = Math.max(speed, rightHand.ohCool + 2.5);
          } else {
            const ow = overwork(
              rightHand.index,
              "eido",
              1.25 * constants.overWorkMultiplier
            );
            recordOverwork(summary, ow);
            speed += ow;
          }
          recordPush(summary);
          speed += 1.15 * constants.pushMultiplier;
          rightHand.index.t = speed;
          rightHand.index.pos = "uflick";
          rightHand.ohCool = speed;
        } else {
          return [
            j,
            speed,
            leftWrist,
            rightWrist,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        break;
      case "U2":
        if (
          rightWrist == Wrist.NEUTRAL &&
          (leftHand.index.pos == "m" ||
            leftWrist != Wrist.NEUTRAL ||
            Math.max(
              overwork(rightHand.index, "home"),
              overwork(rightHand.middle, "home"),
              overwork(rightHand.ring, "u2grip")
            ) <=
              Math.max(
                overwork(leftHand.index, "home"),
                overwork(leftHand.middle, "home"),
                overwork(leftHand.ring, "u2grip")
              ))
        ) {
          const ow1 = overwork(rightHand.index, "home");
          recordOverwork(summary, ow1);
          speed += ow1;
          const ow2 = overwork(rightHand.middle, "home");
          recordOverwork(summary, ow2);
          speed += ow2;
          const ow3 = overwork(
            rightHand.ring,
            "u2grip",
            constants.moveblockPenalty * constants.overWorkMultiplier
          );
          recordOverwork(summary, ow3);
          speed += ow3;
          recordDoubleFingerMove(summary);
          speed += constants.double;
          rightHand.index.t = speed;
          rightHand.index.pos = "uflick";
          rightHand.middle.t = speed;
          rightHand.middle.pos = "uflick";
        } else if (leftWrist == Wrist.NEUTRAL) {
          const ow1 = overwork(leftHand.index, "home");
          recordOverwork(summary, ow1);
          speed += ow1;
          const ow2 = overwork(leftHand.middle, "home");
          recordOverwork(summary, ow2);
          speed += ow2;
          const ow3 = overwork(
            leftHand.ring,
            "u2grip",
            constants.moveblockPenalty * constants.overWorkMultiplier
          );
          recordOverwork(summary, ow3);
          speed += ow3;
          recordDoubleFingerMove(summary);
          speed += constants.double;
          leftHand.index.t = speed;
          leftHand.index.pos = "uflick";
          leftHand.middle.t = speed;
          leftHand.middle.pos = "uflick";
        } else {
          return [
            j,
            speed,
            leftWrist,
            rightWrist,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        break;
      case "D":
        if (
          leftWrist == Wrist.NEUTRAL &&
          (rightWrist != Wrist.NEUTRAL ||
            Math.max(
              overwork(leftHand.ring, "home"),
              overwork(leftHand.middle, "home")
            ) <=
              Math.max(
                overwork(rightHand.ring, "dflick"),
                overwork(rightHand.middle, "home")
              ))
        ) {
          const ow1 = overwork(leftHand.ring, "home");
          recordOverwork(summary, ow1);
          speed += ow1;
          const ow2 = overwork(leftHand.middle, "home");
          recordOverwork(summary, ow2);
          speed += ow2;
          if (prevMove[0] == "B") {
            recordMoveBlock(summary);
            recordRingFlick(summary);
            speed +=
              constants.moveblockPenalty * 0.5 + constants.ringFingerMultiplier;
          } else {
            recordRingFlick(summary);
            speed += constants.ringFingerMultiplier;
          }
          leftHand.ring.t = speed;
          leftHand.ring.pos = "dflick";
        } else if (rightWrist == Wrist.NEUTRAL && prevMove[0] != "B") {
          const ow1 = overwork(rightHand.ring, "dflick");
          recordOverwork(summary, ow1);
          speed += ow1;
          const ow2 = overwork(rightHand.middle, "home");
          recordOverwork(summary, ow2);
          speed += ow2;
          recordRingFlick(summary);
          recordPush(summary);
          speed += constants.ringFingerMultiplier * constants.pushMultiplier;
          rightHand.ring.t = speed;
          rightHand.ring.pos = "home";
        } else {
          return [
            j,
            speed,
            leftWrist,
            rightWrist,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        break;
      case "D'":
        if (
          rightWrist == Wrist.NEUTRAL &&
          (leftWrist != Wrist.NEUTRAL ||
            Math.max(
              overwork(rightHand.ring, "home"),
              overwork(rightHand.middle, "home")
            ) <=
              Math.max(
                overwork(leftHand.ring, "dflick"),
                overwork(leftHand.middle, "home")
              ))
        ) {
          const ow1 = overwork(rightHand.ring, "home");
          recordOverwork(summary, ow1);
          speed += ow1;
          const ow2 = overwork(rightHand.middle, "home");
          recordOverwork(summary, ow2);
          speed += ow2;
          if (prevMove[0] == "B") {
            recordMoveBlock(summary);
            recordRingFlick(summary);
            speed +=
              constants.moveblockPenalty * 0.5 + constants.ringFingerMultiplier;
          } else {
            recordRingFlick(summary);
            speed += constants.ringFingerMultiplier;
          }
          rightHand.ring.t = speed;
          rightHand.ring.pos = "dflick";
        } else if (leftWrist == Wrist.NEUTRAL && prevMove[0] != "B") {
          const ow1 = overwork(leftHand.ring, "dflick");
          recordOverwork(summary, ow1);
          speed += ow1;
          const ow2 = overwork(leftHand.middle, "home");
          recordOverwork(summary, ow2);
          speed += ow2;
          recordRingFlick(summary);
          recordPush(summary);
          speed += constants.ringFingerMultiplier * constants.pushMultiplier;
          leftHand.ring.t = speed;
          leftHand.ring.pos = "home";
        } else {
          return [
            j,
            speed,
            leftWrist,
            rightWrist,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        break;
      case "D2":
        if (
          rightWrist == Wrist.NEUTRAL &&
          (leftWrist != Wrist.NEUTRAL ||
            Math.max(
              overwork(rightHand.middle, "home"),
              overwork(rightHand.ring, "home")
            ) <=
              Math.max(
                overwork(leftHand.middle, "home"),
                overwork(leftHand.ring, "home")
              ))
        ) {
          const ow1 = overwork(rightHand.middle, "home");
          recordOverwork(summary, ow1);
          speed += ow1;
          const ow2 = overwork(rightHand.ring, "home");
          recordOverwork(summary, ow2);
          speed += ow2;
          if (prevMove[0] == "B") {
            recordMoveBlock(summary);
            recordRingFlick(summary);
            speed +=
              constants.moveblockPenalty * 0.5 +
              constants.double * constants.ringFingerMultiplier;
          } else {
            recordRingFlick(summary);
            speed += constants.double * constants.ringFingerMultiplier;
          }
          rightHand.ring.t = speed;
          rightHand.ring.pos = "dflick";
        } else if (leftWrist == Wrist.NEUTRAL) {
          const ow1 = overwork(leftHand.middle, "home");
          recordOverwork(summary, ow1);
          speed += ow1;
          const ow2 = overwork(leftHand.ring, "home");
          recordOverwork(summary, ow2);
          speed += ow2;
          if (prevMove[0] == "B") {
            recordMoveBlock(summary);
            recordRingFlick(summary);
            speed +=
              constants.moveblockPenalty * 0.5 +
              constants.double * constants.ringFingerMultiplier;
          } else {
            recordRingFlick(summary);
            speed += constants.double * constants.ringFingerMultiplier;
          }
          leftHand.ring.t = speed;
          leftHand.ring.pos = "dflick";
        } else {
          return [
            j,
            speed,
            leftWrist,
            rightWrist,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        break;
      case "F":
        if (rightWrist == Wrist.UNDER) {
          const ow = overwork(rightHand.index, "home");
          recordOverwork(summary, ow);
          speed += ow;
          recordFingerMove(summary);
          speed += 1;
          rightHand.index.t = speed;
          rightHand.index.pos = "uflick";
        } else if (leftWrist == Wrist.OVER && move != "f") {
          const ow = overwork(leftHand.ring, "home");
          recordOverwork(summary, ow);
          speed += ow;
          if (prevMove[0] == "D") {
            recordMoveBlock(summary);
            recordRingFlick(summary);
            speed +=
              constants.moveblockPenalty * 0.5 + constants.ringFingerMultiplier;
          } else {
            recordFingerMove(summary);
            speed += 1;
          }
          leftHand.ring.t = speed;
          leftHand.ring.pos = "dflick";
        } else if (
          rightWrist == Wrist.OVER &&
          prevMove[0] != "D" &&
          move != "f"
        ) {
          const ow = overwork(rightHand.ring, "dflick");
          recordOverwork(summary, ow);
          speed += ow;
          recordRingFlick(summary);
          recordPush(summary);
          speed += constants.ringFingerMultiplier * constants.pushMultiplier;
          rightHand.ring.t = speed;
          rightHand.ring.pos = "home";
        } else if (
          leftWrist == Wrist.UNDER &&
          rightWrist == Wrist.NEUTRAL &&
          overwork(rightHand.index, "uflick") == 0
        ) {
          recordFingerMove(summary);
          speed += 1;
          rightHand.index.t = speed;
          rightHand.index.pos = "fflick";
        } else if (
          leftWrist == Wrist.UNDER &&
          overwork(leftHand.index, "uflick") == 0 &&
          prevMove[0] != "U"
        ) {
          speed += constants.pushMultiplier;
          leftHand.index.t = speed;
          leftHand.index.pos = "home";
        } else if (leftWrist == Wrist.UNDER && grip == -1) {
          const ow1 = overwork(
            leftHand.thumb,
            "top",
            0.9 * constants.overWorkMultiplier
          );
          recordOverwork(summary, ow1);
          speed += ow1;
          const ow2 = overwork(leftHand.index, "top");
          recordOverwork(summary, ow2);
          speed += ow2;
          if (prevMove[0] == "D") {
            recordFingerMove(summary);
            speed += 1.8;
          } else {
            recordFingerMove(summary);
            speed += 1;
          }
          leftWrist++;
          leftHand.thumb.t = speed;
          leftHand.thumb.pos = "leftu";
          leftHand.index.t = speed;
          leftHand.index.pos = "top";
        } else if (leftWrist == Wrist.NEUTRAL && grip == -1) {
          const ow1 = overwork(leftHand.thumb, "bottom");
          recordOverwork(summary, ow1);
          speed += ow1;
          const ow2 = overwork(leftHand.index, "top");
          recordOverwork(summary, ow2);
          speed += ow2;
          if (prevMove[0] == "D") {
            recordFingerMove(summary);
            speed += 2.05;
          } else {
            recordFingerMove(summary);
            speed += 1.25;
          }
          leftHand.thumb.t = speed;
          leftHand.thumb.pos = "top";
          leftHand.index.t = speed;
          leftHand.index.pos = "top";
        } else if (
          rightWrist == Wrist.NEUTRAL &&
          leftWrist == Wrist.NEUTRAL &&
          move == "f"
        ) {
          const ow1 = overwork(rightHand.index, "uflick");
          recordOverwork(summary, ow1);
          speed += ow1;
          const ow2 = overwork(rightHand.middle, "home");
          recordOverwork(summary, ow2);
          speed += ow2;
          recordFingerMove(summary);
          speed += 1;
          rightHand.index.t = speed;
          rightHand.index.pos = "fflick";
        } else if (
          j == 0 &&
          rightWrist == Wrist.NEUTRAL &&
          leftWrist == Wrist.NEUTRAL
        ) {
          const ow = overwork(rightHand.thumb, "top");
          recordOverwork(summary, ow);
          speed += ow;
          recordFingerMove(summary);
          speed += 1;
          rightHand.thumb.t = speed;
          rightHand.thumb.pos = "rdown";
          rightHand.middle.t = speed;
          rightHand.middle.pos = "uflick";
        } else {
          return [
            j,
            speed,
            leftWrist,
            rightWrist,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        break;
      case "F'":
        if (leftWrist == Wrist.UNDER) {
          const ow = overwork(leftHand.index, "home");
          recordOverwork(summary, ow);
          speed += ow;
          recordFingerMove(summary);
          speed += 1;
          leftHand.index.t = speed;
          leftHand.index.pos = "uflick";
        } else if (rightWrist == Wrist.OVER && move != "f") {
          const ow = overwork(rightHand.ring, "home");
          recordOverwork(summary, ow);
          speed += ow;
          if (prevMove[0] == "D") {
            recordMoveBlock(summary);
            recordRingFlick(summary);
            speed +=
              constants.moveblockPenalty * 0.5 + constants.ringFingerMultiplier;
          } else {
            recordFingerMove(summary);
            speed += 1;
          }
          rightHand.ring.t = speed;
          rightHand.ring.pos = "dflick";
        } else if (
          leftWrist == Wrist.OVER &&
          prevMove[0] != "D" &&
          move != "f"
        ) {
          const ow = overwork(leftHand.ring, "dflick");
          recordOverwork(summary, ow);
          speed += ow;
          recordRingFlick(summary);
          recordPush(summary);
          speed += constants.ringFingerMultiplier * constants.pushMultiplier;
          leftHand.ring.t = speed;
          leftHand.ring.pos = "home";
        } else if (
          rightWrist == Wrist.UNDER &&
          leftWrist == Wrist.NEUTRAL &&
          overwork(leftHand.index, "uflick") == 0
        ) {
          recordFingerMove(summary);
          speed += 1;
          leftHand.index.t = speed;
          leftHand.index.pos = "fflick";
        } else if (
          rightWrist == Wrist.UNDER &&
          overwork(rightHand.index, "uflick") == 0 &&
          prevMove[0] != "U"
        ) {
          speed += constants.pushMultiplier;
          rightHand.index.t = speed;
          rightHand.index.pos = "home";
        } else if (rightWrist == Wrist.UNDER && grip == 1) {
          speed += overwork(
            rightHand.thumb,
            "top",
            0.9 * constants.overWorkMultiplier
          );
          speed += overwork(rightHand.index, "top");
          if (prevMove[0] == "D") {
            speed += 1.8;
          } else {
            speed += 1;
          }
          rightWrist++;
          rightHand.thumb.t = speed;
          rightHand.thumb.pos = "rightu";
          rightHand.index.t = speed;
          rightHand.index.pos = "top";
        } else if (rightWrist == Wrist.NEUTRAL && grip == 1) {
          speed += overwork(rightHand.thumb, "bottom");
          speed += overwork(rightHand.index, "top");
          if (prevMove[0] == "D") {
            speed += 2.05;
          } else {
            speed += 1.25;
          }
          rightHand.thumb.t = speed;
          rightHand.thumb.pos = "top";
          rightHand.index.t = speed;
          rightHand.index.pos = "top";
        } else if (
          leftWrist == Wrist.NEUTRAL &&
          rightWrist == Wrist.NEUTRAL &&
          move == "f'"
        ) {
          speed += overwork(leftHand.index, "uflick");
          speed += overwork(leftHand.middle, "home");
          speed += 1;
          leftHand.index.t = speed;
          leftHand.index.pos = "fflick";
        } else if (
          j == 0 &&
          rightWrist == Wrist.NEUTRAL &&
          leftWrist == Wrist.NEUTRAL
        ) {
          speed += overwork(leftHand.thumb, "top");
          speed += 1;
          leftHand.thumb.t = speed;
          leftHand.thumb.pos = "rdown";
          leftHand.middle.t = speed;
          leftHand.middle.pos = "uflick";
        } else {
          return [
            j,
            speed,
            leftWrist,
            rightWrist,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        break;
      case "F2":
        if (
          rightWrist == Wrist.UNDER &&
          (leftWrist != Wrist.UNDER ||
            Math.max(
              overwork(rightHand.index, "home"),
              overwork(rightHand.middle, "home"),
              overwork(rightHand.ring, "u2grip")
            ) <=
              Math.max(
                overwork(leftHand.index, "home"),
                overwork(leftHand.middle, "home"),
                overwork(leftHand.ring, "u2grip")
              ))
        ) {
          speed += overwork(rightHand.index, "home");
          speed += overwork(rightHand.middle, "home");
          speed += overwork(rightHand.ring, "u2grip");
          speed += constants.double;
          rightHand.index.t = speed;
          rightHand.index.pos = "uflick";
          rightHand.middle.t = speed;
          rightHand.middle.pos = "uflick";
        } else if (leftWrist == Wrist.UNDER) {
          speed += overwork(leftHand.index, "home");
          speed += overwork(leftHand.middle, "home");
          speed += overwork(leftHand.ring, "u2grip");
          speed += constants.double;
          leftHand.index.t = speed;
          leftHand.index.pos = "uflick";
          leftHand.middle.t = speed;
          leftHand.middle.pos = "uflick";
        } else if (
          rightWrist == Wrist.OVER &&
          (leftWrist != Wrist.OVER ||
            Math.max(
              overwork(rightHand.middle, "home"),
              overwork(rightHand.ring, "home")
            ) <=
              Math.max(
                overwork(leftHand.middle, "home"),
                overwork(leftHand.ring, "home")
              ))
        ) {
          speed += overwork(rightHand.middle, "home");
          speed += overwork(rightHand.ring, "home");
          if (prevMove[0] == "D") {
            speed +=
              constants.double * constants.ringFingerMultiplier +
              constants.moveblockPenalty * 0.5;
          } else {
            speed += constants.double * constants.ringFingerMultiplier;
          }
          rightHand.ring.t = speed;
          rightHand.ring.pos = "dflick";
        } else if (leftWrist == Wrist.OVER) {
          speed += overwork(leftHand.middle, "home");
          speed += overwork(leftHand.ring, "home");
          if (prevMove[0] == "D") {
            speed +=
              constants.double * constants.ringFingerMultiplier +
              constants.moveblockPenalty * 0.5;
          } else {
            speed += constants.double * constants.ringFingerMultiplier;
          }
          leftHand.ring.t = speed;
          leftHand.ring.pos = "dflick";
        } else {
          return [
            j,
            speed,
            leftWrist,
            rightWrist,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        break;
      case "L":
        if (leftWrist == Wrist.BROKEN) {
          leftWrist = Wrist.NEUTRAL;
        } else if (
          leftWrist > Wrist.UNDER &&
          !(rightWrist >= Wrist.OVER && leftWrist <= Wrist.NEUTRAL)
        ) {
          leftWrist--;
        } else {
          return [
            j,
            speed,
            leftWrist - 1,
            rightWrist,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        speed += constants.wristMultiplier;
        break;
      case "L'":
        if (
          leftWrist < Wrist.BROKEN &&
          !(rightWrist <= Wrist.UNDER && leftWrist >= Wrist.NEUTRAL)
        ) {
          leftWrist++;
        } else {
          return [
            j,
            speed,
            leftWrist + 1,
            rightWrist,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        speed += constants.wristMultiplier;
        break;
      case "L2":
        if (leftWrist >= Wrist.OVER && rightWrist < Wrist.OVER) {
          leftWrist = Wrist.UNDER;
        } else if (rightWrist > Wrist.UNDER) {
          leftWrist += 2;
        } else {
          return [
            j,
            speed,
            leftWrist > Wrist.NEUTRAL ? leftWrist - 2 : leftWrist + 2,
            rightWrist,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        speed += constants.double * constants.wristMultiplier;
        break;
      case "B":
        if (rightWrist == Wrist.OVER) {
          speed += overwork(rightHand.index, "home");
          speed += 1;
          rightHand.index.t = speed;
          rightHand.index.pos = "uflick";
        } else if (leftWrist == Wrist.UNDER) {
          speed += overwork(leftHand.ring, "home");
          speed += overwork(leftHand.middle, "home");
          if (prevMove[0] == "U") {
            speed +=
              constants.moveblockPenalty * 0.5 + constants.ringFingerMultiplier;
          } else {
            speed += constants.ringFingerMultiplier;
          }
          leftHand.ring.t = speed;
          leftHand.ring.pos = "dflick";
        } else if (
          leftWrist == Wrist.OVER &&
          prevMove[0] != "U" &&
          prevMove[0] != "D"
        ) {
          if (leftHand.index.pos == "uflick") {
            speed += overwork(
              leftHand.index,
              "eido",
              0.75 * constants.overWorkMultiplier
            );
            speed = Math.max(speed, leftHand.ohCool + 2.5);
          } else {
            speed += overwork(
              leftHand.index,
              "eido",
              1.25 * constants.overWorkMultiplier
            );
          }
          speed += 1.15 * constants.pushMultiplier;
          leftHand.index.t = speed;
          leftHand.index.pos = "uflick";
          leftHand.ohCool = speed;
        } else if (
          leftWrist == Wrist.NEUTRAL &&
          (rightWrist == Wrist.OVER || rightWrist == Wrist.UNDER)
        ) {
          speed += overwork(
            leftHand.index,
            "top",
            0.9 * constants.overWorkMultiplier
          );
          if (prevMove[0] == "U") {
            speed += 1.45;
          } else {
            speed += 1;
          }
          leftHand.index.t = speed;
          leftHand.index.pos = "leftdb";
        } else if (rightWrist == Wrist.UNDER && prevMove[0] != "U") {
          speed += overwork(rightHand.ring, "dflick");
          speed += overwork(rightHand.middle, "home");
          speed += constants.ringFingerMultiplier * constants.pushMultiplier;
          rightHand.ring.t = speed;
          rightHand.ring.pos = "home";
        } else {
          return [
            j,
            speed,
            leftWrist,
            rightWrist,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        break;
      case "B'":
        if (leftWrist == Wrist.OVER) {
          speed += overwork(leftHand.index, "home");
          speed += 1;
          leftHand.index.t = speed;
          leftHand.index.pos = "uflick";
        } else if (rightWrist == Wrist.UNDER) {
          speed += overwork(rightHand.ring, "home");
          speed += overwork(rightHand.middle, "home");
          if (prevMove[0] == "U") {
            speed +=
              constants.moveblockPenalty * 0.5 + constants.ringFingerMultiplier;
          } else {
            speed += constants.ringFingerMultiplier;
          }
          rightHand.ring.t = speed;
          rightHand.ring.pos = "dflick";
        } else if (
          rightWrist == Wrist.OVER &&
          prevMove[0] != "U" &&
          prevMove[0] != "D"
        ) {
          if (rightHand.index.pos == "uflick") {
            speed += overwork(
              rightHand.index,
              "eido",
              0.75 * constants.overWorkMultiplier
            );
            speed = Math.max(speed, rightHand.ohCool + 2.5);
          } else {
            speed += overwork(
              rightHand.index,
              "eido",
              1.25 * constants.overWorkMultiplier
            );
          }
          speed += 1.15 * constants.pushMultiplier;
          rightHand.index.t = speed;
          rightHand.index.pos = "uflick";
          rightHand.ohCool = speed;
        } else if (
          rightWrist == Wrist.NEUTRAL &&
          (leftWrist == Wrist.OVER || leftWrist == Wrist.UNDER)
        ) {
          speed += overwork(
            rightHand.index,
            "top",
            0.9 * constants.overWorkMultiplier
          );
          if (prevMove[0] == "U") {
            speed += 1.45;
          } else {
            speed += 1;
          }
          rightHand.index.t = speed;
          rightHand.index.pos = "rightdb";
        } else if (leftWrist == Wrist.UNDER && prevMove[0] != "U") {
          speed += overwork(leftHand.ring, "dflick");
          speed += overwork(leftHand.middle, "home");
          speed += constants.ringFingerMultiplier * constants.pushMultiplier;
          leftHand.ring.t = speed;
          leftHand.ring.pos = "home";
        } else {
          return [
            j,
            speed,
            leftWrist,
            rightWrist,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        break;
      case "B2":
        if (
          rightWrist == Wrist.OVER &&
          (leftWrist != Wrist.OVER ||
            Math.max(
              overwork(rightHand.index, "home"),
              overwork(rightHand.middle, "home"),
              overwork(rightHand.ring, "u2grip")
            ) <=
              Math.max(
                overwork(leftHand.index, "home"),
                overwork(leftHand.middle, "home"),
                overwork(leftHand.ring, "u2grip")
              ))
        ) {
          speed += overwork(rightHand.index, "home");
          speed += overwork(rightHand.middle, "home");
          speed += overwork(rightHand.ring, "u2grip");
          speed += constants.double;
          rightHand.index.t = speed;
          rightHand.index.pos = "uflick";
          rightHand.middle.t = speed;
          rightHand.middle.pos = "uflick";
        } else if (leftWrist == Wrist.OVER) {
          speed += overwork(leftHand.index, "home");
          speed += overwork(leftHand.middle, "home");
          speed += overwork(leftHand.ring, "u2grip");
          speed += constants.double;
          leftHand.index.t = speed;
          leftHand.index.pos = "uflick";
          leftHand.middle.t = speed;
          leftHand.middle.pos = "uflick";
        } else if (
          leftWrist == Wrist.UNDER &&
          (rightWrist != Wrist.UNDER ||
            Math.max(
              overwork(rightHand.middle, "home"),
              overwork(rightHand.ring, "home")
            ) >
              Math.max(
                overwork(leftHand.middle, "home"),
                overwork(leftHand.ring, "home")
              ))
        ) {
          speed += overwork(leftHand.middle, "home");
          speed += overwork(leftHand.ring, "home");
          if (prevMove[0] == "U") {
            speed +=
              constants.moveblockPenalty * 0.5 +
              constants.double * constants.ringFingerMultiplier;
          } else {
            speed += constants.double * constants.ringFingerMultiplier;
          }
          leftHand.ring.t = speed;
          leftHand.ring.pos = "dflick";
        } else if (rightWrist == Wrist.UNDER) {
          speed += overwork(rightHand.middle, "home");
          speed += overwork(rightHand.ring, "home");
          if (prevMove[0] == "U") {
            speed +=
              constants.moveblockPenalty * 0.5 +
              constants.double * constants.ringFingerMultiplier;
          } else {
            speed += constants.double * constants.ringFingerMultiplier;
          }
          rightHand.ring.t = speed;
          rightHand.ring.pos = "dflick";
        } else {
          return [
            j,
            speed,
            leftWrist,
            rightWrist,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        break;
      case "S":
        if (
          rightWrist == Wrist.NEUTRAL &&
          (leftWrist != Wrist.NEUTRAL ||
            overwork(
              rightHand.index,
              "top",
              1.25 * constants.overWorkMultiplier
            ) <=
              (constants.moveblockPenalty * 0.5 +
                constants.pushMultiplier -
                1) *
                constants.sesliceMultiplier)
        ) {
          speed += overwork(
            rightHand.index,
            "top",
            1.25 * constants.overWorkMultiplier
          );
          speed += constants.sesliceMultiplier;
          rightHand.index.t = speed;
          rightHand.index.pos = "sflick";
        } else if (leftWrist == Wrist.NEUTRAL && rightWrist == Wrist.UNDER) {
          speed += overwork(
            rightHand.index,
            "home",
            1.25 * constants.overWorkMultiplier
          );
          speed += overwork(
            rightHand.thumb,
            "top",
            1.25 * constants.overWorkMultiplier
          );
          speed += overwork(
            rightHand.middle,
            "home",
            1.25 * constants.overWorkMultiplier
          );
          speed += constants.sesliceMultiplier;
          rightHand.thumb.t = speed;
          rightHand.thumb.pos = "top";
          rightHand.middle.t = speed;
          rightHand.middle.pos = "eflick";
        } else if (
          leftWrist == Wrist.NEUTRAL &&
          (rightWrist == Wrist.NEUTRAL ||
            (rightWrist == Wrist.OVER && (prevMove == "R" || prevMove == "L")))
        ) {
          speed += overwork(
            leftHand.index,
            "uflick",
            1.25 * constants.overWorkMultiplier
          );
          if (prevMove[0] == "U") {
            speed +=
              constants.moveblockPenalty * 0.5 +
              constants.pushMultiplier * constants.sesliceMultiplier;
          } else {
            speed += constants.pushMultiplier * constants.sesliceMultiplier;
          }
          leftHand.index.t = speed;
          leftHand.index.pos = "top";
        } else {
          return [
            j,
            speed,
            leftWrist,
            rightWrist,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        break;
      case "S'":
        if (
          leftWrist == Wrist.NEUTRAL &&
          (rightWrist != Wrist.NEUTRAL ||
            overwork(
              leftHand.index,
              "top",
              1.25 * constants.overWorkMultiplier
            ) <=
              (constants.moveblockPenalty * 0.5 +
                constants.pushMultiplier -
                1) *
                constants.sesliceMultiplier)
        ) {
          speed += overwork(
            leftHand.index,
            "top",
            1.25 * constants.overWorkMultiplier
          );
          speed += constants.sesliceMultiplier;
          leftHand.index.t = speed;
          leftHand.index.pos = "sflick";
        } else if (rightWrist == Wrist.NEUTRAL && leftWrist == Wrist.UNDER) {
          speed += overwork(
            leftHand.index,
            "home",
            1.25 * constants.overWorkMultiplier
          );
          speed += overwork(
            leftHand.thumb,
            "bottom",
            1.25 * constants.overWorkMultiplier
          );
          speed += overwork(
            leftHand.middle,
            "home",
            1.25 * constants.overWorkMultiplier
          );
          speed += constants.sesliceMultiplier;
          leftHand.thumb.t = speed;
          leftHand.thumb.pos = "top";
          leftHand.middle.t = speed;
          leftHand.middle.pos = "eflick";
        } else if (
          rightWrist == Wrist.NEUTRAL &&
          (leftWrist == Wrist.NEUTRAL ||
            (leftWrist == Wrist.OVER && (prevMove == "R" || prevMove == "L")))
        ) {
          speed += overwork(
            rightHand.index,
            "uflick",
            1.25 * constants.overWorkMultiplier
          );
          if (prevMove[0] == "U") {
            speed +=
              constants.moveblockPenalty * 0.5 +
              constants.pushMultiplier * constants.sesliceMultiplier;
          } else {
            speed += constants.pushMultiplier * constants.sesliceMultiplier;
          }
          rightHand.index.t = speed;
          rightHand.index.pos = "top";
        } else {
          return [
            j,
            speed,
            leftWrist,
            rightWrist,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        break;
      case "S2":
        if (
          (rightWrist == Wrist.UNDER || rightWrist == Wrist.OVER) &&
          leftWrist == Wrist.NEUTRAL
        ) {
          speed += overwork(rightHand.thumb, "home");
          speed += overwork(rightHand.index, "home");
          speed += overwork(rightHand.middle, "home");
          speed += overwork(rightHand.ring, "u2grip");
          speed += constants.sesliceMultiplier * constants.double;
          rightHand.middle.t = speed;
          rightHand.middle.pos = "e";
          rightHand.index.t = speed;
          rightHand.index.pos = "e";
        } else if (
          (leftWrist == Wrist.UNDER || leftWrist == Wrist.OVER) &&
          rightWrist == Wrist.NEUTRAL
        ) {
          speed += overwork(leftHand.thumb, "home");
          speed += overwork(leftHand.index, "home");
          speed += overwork(leftHand.middle, "home");
          speed += overwork(leftHand.ring, "u2grip");
          speed += constants.sesliceMultiplier * constants.double;
          leftHand.middle.t = speed;
          leftHand.middle.pos = "e";
          leftHand.index.t = speed;
          leftHand.index.pos = "e";
        } else {
          return [
            j,
            speed,
            leftWrist,
            rightWrist,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        break;
      case "E":
        if (
          (rightWrist == Wrist.OVER || rightWrist == Wrist.UNDER) &&
          leftWrist == Wrist.NEUTRAL
        ) {
          speed += overwork(leftHand.index, "home");
          speed += constants.sesliceMultiplier;
          leftHand.index.t = speed;
          leftHand.index.pos = "e";
        } else if (
          (leftWrist == Wrist.OVER || leftWrist == Wrist.UNDER) &&
          rightWrist == Wrist.NEUTRAL &&
          prevMove[0] != "B"
        ) {
          speed += overwork(rightHand.index, "e");
          speed += constants.sesliceMultiplier * constants.pushMultiplier;
          rightHand.index.t = speed;
          rightHand.index.pos = "home";
        } else {
          return [
            j,
            speed,
            leftWrist,
            rightWrist,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        break;
      case "E'":
        if (
          (leftWrist == Wrist.OVER || leftWrist == Wrist.UNDER) &&
          rightWrist == Wrist.NEUTRAL
        ) {
          speed += overwork(rightHand.index, "home");
          speed += constants.sesliceMultiplier;
          rightHand.index.t = speed;
          rightHand.index.pos = "e";
        } else if (
          (rightWrist == Wrist.OVER || rightWrist == Wrist.UNDER) &&
          leftWrist == Wrist.NEUTRAL &&
          prevMove[0] != "B"
        ) {
          speed += overwork(leftHand.index, "e");
          speed += constants.sesliceMultiplier * constants.pushMultiplier;
          leftHand.index.t = speed;
          leftHand.index.pos = "home";
        } else {
          return [
            j,
            speed,
            leftWrist,
            rightWrist,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        break;
      case "E2":
        if (
          (leftWrist == Wrist.OVER || leftWrist == Wrist.UNDER) &&
          rightWrist == Wrist.NEUTRAL
        ) {
          speed += overwork(rightHand.index, "home");
          speed += overwork(rightHand.middle, "home");
          speed += overwork(rightHand.ring, "u2grip");
          speed += constants.sesliceMultiplier * constants.double;
          rightHand.index.t = speed;
          rightHand.index.pos = "e";
          rightHand.middle.t = speed;
          rightHand.middle.pos = "e";
        } else if (
          (rightWrist == Wrist.OVER || rightWrist == Wrist.UNDER) &&
          leftWrist == Wrist.NEUTRAL
        ) {
          speed += overwork(leftHand.index, "home");
          speed += overwork(leftHand.middle, "home");
          speed += overwork(leftHand.ring, "u2grip");
          speed += constants.sesliceMultiplier * constants.double;
          leftHand.index.t = speed;
          leftHand.index.pos = "e";
          leftHand.middle.t = speed;
          leftHand.middle.pos = "e";
        } else {
          return [
            j,
            speed,
            leftWrist,
            rightWrist,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        break;
      case "M'":
        if (leftWrist == Wrist.NEUTRAL) {
          speed += overwork(leftHand.thumb, "home");
          speed += overwork(leftHand.index, "m");
          speed += overwork(leftHand.middle, "m");
          speed += overwork(leftHand.ring, "m");
          if (prevMove[0] == "B") {
            speed += 1.8;
          } else {
            speed += 1;
          }
          leftHand.thumb.t = speed;
          leftHand.thumb.pos = "home";
          leftHand.index.t = speed;
          leftHand.index.pos = "m";
          leftHand.middle.t = speed;
          leftHand.middle.pos = "mflick";
          leftHand.ring.t = speed;
          leftHand.ring.pos = "m";
        } else {
          return [
            j,
            speed,
            leftWrist,
            rightWrist,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        break;
      case "M":
        if (leftWrist == Wrist.NEUTRAL && prevMove[0] != "B") {
          speed += overwork(leftHand.thumb, "home");
          speed += overwork(leftHand.index, "m");
          speed += overwork(
            leftHand.middle,
            "mflick",
            1.25 * constants.overWorkMultiplier
          );
          speed += overwork(leftHand.ring, "m");
          speed += constants.pushMultiplier;
          leftHand.thumb.t = speed;
          leftHand.thumb.pos = "home";
          leftHand.index.t = speed;
          leftHand.index.pos = "m";
          leftHand.middle.t = speed;
          leftHand.middle.pos = "m";
          leftHand.ring.t = speed;
          leftHand.ring.pos = "m";
        } else {
          return [
            j,
            speed,
            leftWrist,
            rightWrist,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        break;
      case "M2":
        if (leftWrist == Wrist.NEUTRAL) {
          speed += overwork(leftHand.thumb, "home");
          speed += overwork(leftHand.index, "m");
          speed += overwork(leftHand.middle, "m");
          speed += overwork(leftHand.ring, "m");
          if (prevMove[0] == "B") {
            speed += constants.moveblockPenalty + constants.double;
          } else {
            speed += constants.double;
          }
          leftHand.thumb.t = speed;
          leftHand.thumb.pos = "home";
          leftHand.index.t = speed;
          leftHand.index.pos = "m";
          leftHand.middle.t = speed;
          leftHand.middle.pos = "mflick";
          leftHand.ring.t = speed;
          leftHand.ring.pos = "m";
        } else {
          return [
            j,
            speed,
            leftWrist,
            rightWrist,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        break;
      case "X":
        leftWrist += 1;
        rightWrist += 1;
        if (leftWrist > Wrist.OVER || rightWrist > Wrist.OVER) {
          return [
            j + 1,
            speed,
            leftWrist,
            rightWrist,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        break;
      case "X'":
        leftWrist -= 1;
        rightWrist -= 1;
        if (leftWrist < Wrist.UNDER || rightWrist < Wrist.UNDER) {
          return [
            j + 1,
            speed,
            leftWrist,
            rightWrist,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        break;
      case "X2":
        if (leftWrist >= Wrist.OVER && rightWrist >= Wrist.OVER) {
          leftWrist -= 2;
          rightWrist -= 2;
        } else if (leftWrist <= Wrist.UNDER && rightWrist <= Wrist.UNDER) {
          leftWrist += 2;
          rightWrist += 2;
        } else if (leftWrist + rightWrist > Wrist.NEUTRAL) {
          return [
            j,
            speed,
            leftWrist - 2,
            rightWrist - 2,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        } else {
          return [
            j,
            speed,
            leftWrist + 2,
            rightWrist + 2,
            lastFingerTime(leftHand),
            lastFingerTime(rightHand),
          ];
        }
        break;
      case "Y":
      case "Y'":
      case "Z":
      case "Z'":
        speed += constants.rotation;
        return [
          j + 1,
          speed,
          Wrist.NEUTRAL,
          Wrist.NEUTRAL,
          lastFingerTime(leftHand),
          lastFingerTime(rightHand),
        ];
        break;
      case "Y2":
      case "Z2":
        speed += constants.rotation * constants.double;
        return [
          j + 1,
          speed,
          Wrist.NEUTRAL,
          Wrist.NEUTRAL,
          lastFingerTime(leftHand),
          lastFingerTime(rightHand),
        ];
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
          rightWrist == Wrist.OVER) ||
        (normalMove == "R'" &&
          move == splitSeq[j - 2] &&
          splitSeq[j - 1].toUpperCase() == "D")
      ) {
        speed -= 0.3;
      }
    }

    if (
      normalMove == "U" &&
      (leftWrist == Wrist.UNDER || rightWrist == Wrist.UNDER)
    ) {
      recordDestabilize(summary);
      speed += constants.destabilizePenalty;
    }

    if (
      normalMove == "B" &&
      (leftWrist == Wrist.NEUTRAL || rightWrist == Wrist.NEUTRAL)
    ) {
      recordDestabilize(summary);
      speed += constants.destabilizePenalty;
    }

    if (
      normalMove == "D" &&
      (leftWrist == Wrist.OVER || rightWrist == Wrist.OVER)
    ) {
      recordDestabilize(summary);
      speed += constants.destabilizePenalty;
    }

    if (
      normalMove == "S" &&
      (leftWrist == Wrist.OVER ||
        rightWrist == Wrist.OVER ||
        leftWrist == Wrist.UNDER ||
        rightWrist == Wrist.UNDER)
    ) {
      recordDestabilize(summary);
      speed += constants.destabilize;
    }

    if (
      normalMove == "E" &&
      (leftWrist == Wrist.NEUTRAL || rightWrist == Wrist.NEUTRAL)
    ) {
      recordDestabilize(summary);
      speed += constants.destabilize;
    }
  }

  return [
    -1,
    speed,
    startingLeftGrip,
    startingRightGrip,
    lastFingerTime(leftHand),
    lastFingerTime(rightHand),
    summary,
  ];
}

export function algSpeed(
  sequence,
  ignoreUnknownMoves = false,
  ignoreStartingAndEndingUMoves = false,
  wristMultiplier = 0.8,
  pushMultiplier = 1.3,
  ringFingerMultiplier = 1.4,
  destabilizePenalty = 0.5,
  addRegrip = 1,
  double = 1.65,
  sesliceMultiplier = 1.25,
  overWorkMultiplier = 2.25,
  moveblockPenalty = 0.8,
  // wtf
  rotation = 3.5
) {
  const constants = {
    wristMultiplier,
    pushMultiplier,
    ringFingerMultiplier,
    destabilizePenalty,
    addRegrip,
    double,
    sesliceMultiplier,
    overWorkMultiplier,
    moveblockPenalty,
    rotation,
  };

  let splitSeq = sequence.split(" ");
  let trueSplitSeq = [];

  for (let i = 0; i < splitSeq.length; i++) {
    if (ignoreUnknownMoves) {
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

  if (ignoreStartingAndEndingUMoves) {
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
    test(splitSeq, Wrist.NEUTRAL, Wrist.NEUTRAL, 0, constants),
    test(splitSeq, Wrist.NEUTRAL, Wrist.UNDER, 1 + addRegrip, constants),
    test(splitSeq, Wrist.NEUTRAL, Wrist.OVER, 1 + addRegrip, constants),
    test(splitSeq, Wrist.UNDER, Wrist.NEUTRAL, 1 + addRegrip, constants),
    test(splitSeq, Wrist.OVER, Wrist.NEUTRAL, 1 + addRegrip, constants),
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
      // Return both the speed and the summary for introspection
      const finalSpeed = Math.round(bestTest[1] * 10) / 10;
      const finalSummary = bestTest[6] || makeSummary(); // Get summary if available

      // For backward compatibility, still return just the number
      // But you can change this to return {speed: finalSpeed, summary: finalSummary}
      return finalSpeed;
    }
    tests = [];

    let prevMoveType = bestTest[0] >= 1 ? splitSeq[bestTest[0] - 1][0] : " ";
    let prev2Type = bestTest[0] >= 2 ? splitSeq[bestTest[0] - 2][0] : " ";
    let doubleRegrip = false;

    if (
      (bestTest[2] > Wrist.OVER || bestTest[2] < Wrist.UNDER) &&
      (bestTest[3] > Wrist.OVER || bestTest[3] < Wrist.UNDER)
    ) {
      doubleRegrip = true;
    }

    for (let leftWrist = Wrist.UNDER; leftWrist < Wrist.BROKEN; leftWrist++) {
      for (
        let rightWrist = Wrist.UNDER;
        rightWrist < Wrist.BROKEN;
        rightWrist++
      ) {
        let leftMatch = bestTest[2] == leftWrist;
        let rightMatch = bestTest[3] == rightWrist;
        if (["X", "x", "Y", "y", "Z", "z"].includes(prevMoveType)) {
          // constants.rotation handling
          tests.push(
            test(
              splitSeq.slice(bestTest[0]),
              leftWrist,
              rightWrist,
              bestTest[1],
              constants
            )
          );
        } else {
          // double regrips should be exceedingly rare, so penalty would almost always equal 2
          let penalty = doubleRegrip
            ? constants.rotation * constants.double
            : 2;

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
                bestTest[1] + penalty + addRegrip,
                constants
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
                bestTest[1] + penalty + addRegrip,
                constants
              )
            );
          }
        }
      }
    }

    splitSeq = splitSeq.slice(bestTest[0]);
  }
}

// ============================================================
// Enhanced API: Get detailed summary with event breakdown
// ============================================================

/**
 * Analyzes an algorithm and returns detailed event summary
 * @param {string} sequence - The algorithm sequence
 * @param {...any} options - Same options as algSpeed
 * @returns {Object} {speed: number, summary: Object, aggregatedCost: number}
 */
export function algSpeedDetailed(
  sequence,
  ignoreUnknownMoves = false,
  ignoreStartingAndEndingUMoves = false,
  wristMultiplier = 0.8,
  pushMultiplier = 1.3,
  ringFingerMultiplier = 1.4,
  destabilizePenalty = 0.5,
  addRegrip = 1,
  double = 1.65,
  sesliceMultiplier = 1.25,
  overWorkMultiplier = 2.25,
  moveblockPenalty = 0.8,
  rotation = 3.5
) {
  const constants = {
    wristMultiplier,
    pushMultiplier,
    ringFingerMultiplier,
    destabilizePenalty,
    addRegrip,
    double,
    sesliceMultiplier,
    overWorkMultiplier,
    moveblockPenalty,
    rotation,
  };

  let splitSeq = sequence.split(" ");
  let trueSplitSeq = [];

  // Same preprocessing as algSpeed
  for (let i = 0; i < splitSeq.length; i++) {
    if (ignoreUnknownMoves) {
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

  if (ignoreStartingAndEndingUMoves) {
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
    test(splitSeq, Wrist.NEUTRAL, Wrist.NEUTRAL, 0, constants),
    test(splitSeq, Wrist.NEUTRAL, Wrist.UNDER, 1 + addRegrip, constants),
    test(splitSeq, Wrist.NEUTRAL, Wrist.OVER, 1 + addRegrip, constants),
    test(splitSeq, Wrist.UNDER, Wrist.NEUTRAL, 1 + addRegrip, constants),
    test(splitSeq, Wrist.OVER, Wrist.NEUTRAL, 1 + addRegrip, constants),
  ];

  while (true) {
    for (let i = 0; i < tests.length; i++) {
      if (tests[i][0] == "U") {
        return {
          speed: tests[i][1],
          summary: tests[i][6] || makeSummary(),
          aggregatedCost: aggregateCost(
            tests[i][6] || makeSummary(),
            constants
          ),
        };
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
      const finalSpeed = Math.round(bestTest[1] * 10) / 10;
      const finalSummary = bestTest[6] || makeSummary();
      const aggregatedCost = aggregateCost(finalSummary, constants);

      return {
        speed: finalSpeed,
        summary: finalSummary,
        aggregatedCost: aggregatedCost,
      };
    }

    // Continue regrip search...
    tests = [];
    let prevMoveType = bestTest[0] >= 1 ? splitSeq[bestTest[0] - 1][0] : " ";
    let prev2Type = bestTest[0] >= 2 ? splitSeq[bestTest[0] - 2][0] : " ";
    let doubleRegrip = false;

    if (
      (bestTest[2] > Wrist.OVER || bestTest[2] < Wrist.UNDER) &&
      (bestTest[3] > Wrist.OVER || bestTest[3] < Wrist.UNDER)
    ) {
      doubleRegrip = true;
    }

    for (let leftWrist = Wrist.UNDER; leftWrist < Wrist.BROKEN; leftWrist++) {
      for (
        let rightWrist = Wrist.UNDER;
        rightWrist < Wrist.BROKEN;
        rightWrist++
      ) {
        let leftMatch = bestTest[2] == leftWrist;
        let rightMatch = bestTest[3] == rightWrist;
        if (["X", "x", "Y", "y", "Z", "z"].includes(prevMoveType)) {
          tests.push(
            test(
              splitSeq.slice(bestTest[0]),
              leftWrist,
              rightWrist,
              bestTest[1],
              constants
            )
          );
        } else {
          let penalty = doubleRegrip
            ? constants.rotation * constants.double
            : 2;

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
            let rHandLatency = Math.max(0, 2 - (bestTest[1] - bestTest[5]));
            penalty = Math.max(rHandLatency, rMoveLatency, lMoveLatency * 2);
            tests.push(
              test(
                splitSeq.slice(bestTest[0]),
                leftWrist,
                rightWrist,
                bestTest[1] + penalty + addRegrip,
                constants
              )
            );
          } else if (rightMatch || doubleRegrip) {
            let lHandLatency = Math.max(0, 2 - (bestTest[1] - bestTest[4]));
            penalty = Math.max(lHandLatency, lMoveLatency, rMoveLatency * 2);
            tests.push(
              test(
                splitSeq.slice(bestTest[0]),
                leftWrist,
                rightWrist,
                bestTest[1] + penalty + addRegrip,
                constants
              )
            );
          }
        }
      }
    }

    splitSeq = splitSeq.slice(bestTest[0]);
  }
}

// Export the new utility functions for external use
export { makeSummary, aggregateCost };
