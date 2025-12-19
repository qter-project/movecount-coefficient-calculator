#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WristPosition {
    Under,    // -1
    Neutral,  // 0
    Over,     // 1
    Broken,   // 2 (out of bounds, triggers regrip)
}

impl WristPosition {
    /// Check if wrist is at least Neutral (not Under)
    pub fn is_at_least_neutral(&self) -> bool {
        !matches!(self, WristPosition::Under)
    }

    /// Check if wrist is Over or Broken
    pub fn is_at_least_over(&self) -> bool {
        matches!(self, WristPosition::Over | WristPosition::Broken)
    }

    /// Check if wrist is at most Neutral (Under or Neutral)
    pub fn is_at_most_neutral(&self) -> bool {
        matches!(self, WristPosition::Under | WristPosition::Neutral)
    }

    /// Check if wrist is less than Over (Under or Neutral)
    pub fn is_below_over(&self) -> bool {
        matches!(self, WristPosition::Under | WristPosition::Neutral)
    }
}

impl Default for WristPosition {
    fn default() -> Self {
        WristPosition::Neutral
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FingerPosition {
    /// Default/resting position
    Home,
    /// After U layer flick
    UFlick,
    /// M slice position
    M,
    /// Finger at top of cube
    Top,
    /// After D layer flick
    DFlick,
    /// Grip for U2 moves
    U2Grip,
    /// Specific OH (one-handed) position
    Eido,
    /// After F layer flick
    FFlick,
    /// Left double-bar position
    LeftDb,
    /// Right double-bar position
    RightDb,
    /// After S slice flick
    SFlick,
    /// After E slice flick
    EFlick,
    /// E slice position
    E,
    /// After M slice flick
    MFlick,
    /// Finger at bottom of cube
    Bottom,
}

impl Default for FingerPosition {
    fn default() -> Self {
        FingerPosition::Home
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Finger {
    Thumb,
    Index,
    Middle,
    Ring,
}

#[derive(Debug, Clone, Copy)]
pub struct FingerState {
    pub position: FingerPosition,
    /// Timestamp of last action for this finger
    pub timestamp: f64,
}

impl Default for FingerState {
    fn default() -> Self {
        Self {
            position: FingerPosition::Home,
            timestamp: 0.0,
        }
    }
}

#[derive(Debug, Clone)]
pub struct HandState {
    pub wrist_position: WristPosition,
    pub thumb: FingerState,
    pub index: FingerState,
    pub middle: FingerState,
    pub ring: FingerState,
    /// One-handed push cooldown timestamp
    pub last_one_handed_push: f64,
}

impl Default for HandState {
    fn default() -> Self {
        Self {
            wrist_position: WristPosition::Neutral,
            thumb: FingerState::default(),
            index: FingerState::default(),
            middle: FingerState::default(),
            ring: FingerState::default(),
            last_one_handed_push: 0.0,
        }
    }
}

impl HandState {
    pub fn get_finger_mut(&mut self, finger: Finger) -> &mut FingerState {
        match finger {
            Finger::Thumb => &mut self.thumb,
            Finger::Index => &mut self.index,
            Finger::Middle => &mut self.middle,
            Finger::Ring => &mut self.ring,
        }
    }

    pub fn get_finger(&self, finger: Finger) -> &FingerState {
        match finger {
            Finger::Thumb => &self.thumb,
            Finger::Index => &self.index,
            Finger::Middle => &self.middle,
            Finger::Ring => &self.ring,
        }
    }
}

#[derive(Debug, Clone)]
pub struct HandStates {
    pub left: HandState,
    pub right: HandState,
    /// R/L grip orientation (-1 or 1)
    pub grip: i8,
    /// U/D grip orientation (-1 or 1)
    pub udgrip: i8,
    /// Current accumulated time/cost
    pub speed: f64,
    /// Saved speed for U/D move sequences
    pub prev_speed: f64,
    /// First move speed for U/D sequences
    pub first_move_speed: f64,
}

impl Default for HandStates {
    fn default() -> Self {
        Self {
            left: HandState::default(),
            right: HandState::default(),
            grip: 1,
            udgrip: 1,
            speed: 0.0,
            prev_speed: 0.0,
            first_move_speed: 0.0,
        }
    }
}
