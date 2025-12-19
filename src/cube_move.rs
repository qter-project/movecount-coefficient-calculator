use std::str::FromStr;

#[derive(Debug, Clone, PartialEq)]
pub enum CubeMove {
    /// Right face clockwise 90° (R)
    RIGHT_TURN,
    /// Right face clockwise 180° (R2)
    RIGHT_TURN_DOUBLE,
    /// Right face counter-clockwise 90° (R')
    RIGHT_TURN_PRIME,
    /// Up face clockwise 90° (U)
    UP_TURN,
    /// Up face counter-clockwise 90° (U')
    UP_TURN_PRIME,
    /// Up face clockwise 180° (U2)
    UP_TURN_DOUBLE,
    /// Front face clockwise 90° (F)
    FRONT_TURN,
    /// Front face clockwise 180° (F2)
    FRONT_TURN_DOUBLE,
    /// Front face counter-clockwise 90° (F')
    FRONT_TURN_PRIME,
    /// Down face clockwise 90° (D)
    DOWN_TURN,
    /// Down face clockwise 180° (D2)
    DOWN_TURN_DOUBLE,
    /// Down face counter-clockwise 90° (D')
    DOWN_TURN_PRIME,
    /// Left face clockwise 90° (L)
    LEFT_TURN,
    /// Left face clockwise 180° (L2)
    LEFT_TURN_DOUBLE,
    /// Left face counter-clockwise 90° (L')
    LEFT_TURN_PRIME,
    /// Back face clockwise 90° (B)
    BACK_TURN,
    /// Back face clockwise 180° (B2)
    BACK_TURN_DOUBLE,
    /// Back face counter-clockwise 90° (B')
    BACK_TURN_PRIME,
    /// Middle slice (between L and R) 90° (M)
    MIDDLE_TURN,
    /// Middle slice (between L and R) 180° (M2)
    MIDDLE_TURN_DOUBLE,
    /// Middle slice (between L and R) counter-clockwise 90° (M')
    MIDDLE_TURN_PRIME,
    /// Standing slice (between F and B) 90° (S)
    STANDING_TURN,
    /// Standing slice (between F and B) 180° (S2)
    STANDING_TURN_DOUBLE,
    /// Standing slice (between F and B) counter-clockwise 90° (S')
    STANDING_TURN_PRIME,
    /// Equatorial slice (between U and D) 90° (E)
    EQUATORIAL_TURN,
    /// Equatorial slice (between U and D) 180° (E2)
    EQUATORIAL_TURN_DOUBLE,
    /// Equatorial slice (between U and D) counter-clockwise 90° (E')
    EQUATORIAL_TURN_PRIME,
    /// Rotate entire cube on R axis clockwise 90° (X)
    X_ROTATION,
    /// Rotate entire cube on R axis counter-clockwise 90° (X')
    X_ROTATION_PRIME,
    /// Rotate entire cube on R axis 180° (X2)
    X_ROTATION_DOUBLE,
    /// Rotate entire cube on U axis clockwise 90° (Y)
    Y_ROTATION,
    /// Rotate entire cube on U axis counter-clockwise 90° (Y')
    Y_ROTATION_PRIME,
    /// Rotate entire cube on U axis 180° (Y2)
    Y_ROTATION_DOUBLE,
    /// Rotate entire cube on F axis clockwise 90° (Z)
    Z_ROTATION,
    /// Rotate entire cube on F axis counter-clockwise 90° (Z')
    Z_ROTATION_PRIME,
    /// Rotate entire cube on F axis 180° (Z2)
    Z_ROTATION_DOUBLE,
    /// Right two layers clockwise 90° (r)
    RIGHT_WIDE_TURN,
    /// Right two layers clockwise 180° (r2)
    RIGHT_WIDE_TURN_DOUBLE,
    /// Right two layers counter-clockwise 90° (r')
    RIGHT_WIDE_TURN_PRIME,
    /// Up two layers clockwise 90° (u)
    UP_WIDE_TURN,
    /// Up two layers counter-clockwise 90° (u')
    UP_WIDE_TURN_PRIME,
    /// Up two layers clockwise 180° (u2)
    UP_WIDE_TURN_DOUBLE,
    /// Front two layers clockwise 90° (f)
    FRONT_WIDE_TURN,
    /// Front two layers clockwise 180° (f2)
    FRONT_WIDE_TURN_DOUBLE,
    /// Front two layers counter-clockwise 90° (f')
    FRONT_WIDE_TURN_PRIME,
    /// Down two layers clockwise 90° (d)
    DOWN_WIDE_TURN,
    /// Down two layers clockwise 180° (d2)
    DOWN_WIDE_TURN_DOUBLE,
    /// Down two layers counter-clockwise 90° (d')
    DOWN_WIDE_TURN_PRIME,
    /// Left two layers clockwise 90° (l)
    LEFT_WIDE_TURN,
    /// Left two layers clockwise 180° (l2)
    LEFT_WIDE_TURN_DOUBLE,
    /// Left two layers counter-clockwise 90° (l')
    LEFT_WIDE_TURN_PRIME,
    /// Back two layers clockwise 90° (b)
    BACK_WIDE_TURN,
    /// Back two layers clockwise 180° (b2)
    BACK_WIDE_TURN_DOUBLE,
    /// Back two layers counter-clockwise 90° (b')
    BACK_WIDE_TURN_PRIME,
}

impl FromStr for CubeMove {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "R" => Some(CubeMove::RIGHT_TURN),
            "R2" => Some(CubeMove::RIGHT_TURN_DOUBLE),
            "R'" => Some(CubeMove::RIGHT_TURN_PRIME),
            "U" => Some(CubeMove::UP_TURN),
            "U'" => Some(CubeMove::UP_TURN_PRIME),
            "U2" => Some(CubeMove::UP_TURN_DOUBLE),
            "F" => Some(CubeMove::FRONT_TURN),
            "F2" => Some(CubeMove::FRONT_TURN_DOUBLE),
            "F'" => Some(CubeMove::FRONT_TURN_PRIME),
            "D" => Some(CubeMove::DOWN_TURN),
            "D2" => Some(CubeMove::DOWN_TURN_DOUBLE),
            "D'" => Some(CubeMove::DOWN_TURN_PRIME),
            "L" => Some(CubeMove::LEFT_TURN),
            "L2" => Some(CubeMove::LEFT_TURN_DOUBLE),
            "L'" => Some(CubeMove::LEFT_TURN_PRIME),
            "B" => Some(CubeMove::BACK_TURN),
            "B2" => Some(CubeMove::BACK_TURN_DOUBLE),
            "B'" => Some(CubeMove::BACK_TURN_PRIME),
            "M" => Some(CubeMove::MIDDLE_TURN),
            "M2" => Some(CubeMove::MIDDLE_TURN_DOUBLE),
            "M'" => Some(CubeMove::MIDDLE_TURN_PRIME),
            "S" => Some(CubeMove::STANDING_TURN),
            "S2" => Some(CubeMove::STANDING_TURN_DOUBLE),
            "S'" => Some(CubeMove::STANDING_TURN_PRIME),
            "E" => Some(CubeMove::EQUATORIAL_TURN),
            "E2" => Some(CubeMove::EQUATORIAL_TURN_DOUBLE),
            "E'" => Some(CubeMove::EQUATORIAL_TURN_PRIME),
            "X" => Some(CubeMove::X_ROTATION),
            "X'" => Some(CubeMove::X_ROTATION_PRIME),
            "X2" => Some(CubeMove::X_ROTATION_DOUBLE),
            "Y" => Some(CubeMove::Y_ROTATION),
            "Y'" => Some(CubeMove::Y_ROTATION_PRIME),
            "Y2" => Some(CubeMove::Y_ROTATION_DOUBLE),
            "Z" => Some(CubeMove::Z_ROTATION),
            "Z'" => Some(CubeMove::Z_ROTATION_PRIME),
            "Z2" => Some(CubeMove::Z_ROTATION_DOUBLE),
            // Wide CubeMoves
            "r" => Some(CubeMove::RIGHT_WIDE_TURN),
            "r2" => Some(CubeMove::RIGHT_WIDE_TURN_DOUBLE),
            "r'" => Some(CubeMove::RIGHT_WIDE_TURN_PRIME),
            "u" => Some(CubeMove::UP_WIDE_TURN),
            "u'" => Some(CubeMove::UP_WIDE_TURN_PRIME),
            "u2" => Some(CubeMove::UP_WIDE_TURN_DOUBLE),
            "f" => Some(CubeMove::FRONT_WIDE_TURN),
            "f2" => Some(CubeMove::FRONT_WIDE_TURN_DOUBLE),
            "f'" => Some(CubeMove::FRONT_WIDE_TURN_PRIME),
            "d" => Some(CubeMove::DOWN_WIDE_TURN),
            "d2" => Some(CubeMove::DOWN_WIDE_TURN_DOUBLE),
            "d'" => Some(CubeMove::DOWN_WIDE_TURN_PRIME),
            "l" => Some(CubeMove::LEFT_WIDE_TURN),
            "l2" => Some(CubeMove::LEFT_WIDE_TURN_DOUBLE),
            "l'" => Some(CubeMove::LEFT_WIDE_TURN_PRIME),
            "b" => Some(CubeMove::BACK_WIDE_TURN),
            "b2" => Some(CubeMove::BACK_WIDE_TURN_DOUBLE),
            "b'" => Some(CubeMove::BACK_WIDE_TURN_PRIME),
            _ => None,
        }
        .ok_or(())
    }
}

impl std::fmt::Display for CubeMove {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s = match self {
            CubeMove::RIGHT_TURN => "R",
            CubeMove::RIGHT_TURN_DOUBLE => "R2",
            CubeMove::RIGHT_TURN_PRIME => "R'",
            CubeMove::UP_TURN => "U",
            CubeMove::UP_TURN_PRIME => "U'",
            CubeMove::UP_TURN_DOUBLE => "U2",
            CubeMove::FRONT_TURN => "F",
            CubeMove::FRONT_TURN_DOUBLE => "F2",
            CubeMove::FRONT_TURN_PRIME => "F'",
            CubeMove::DOWN_TURN => "D",
            CubeMove::DOWN_TURN_DOUBLE => "D2",
            CubeMove::DOWN_TURN_PRIME => "D'",
            CubeMove::LEFT_TURN => "L",
            CubeMove::LEFT_TURN_DOUBLE => "L2",
            CubeMove::LEFT_TURN_PRIME => "L'",
            CubeMove::BACK_TURN => "B",
            CubeMove::BACK_TURN_DOUBLE => "B2",
            CubeMove::BACK_TURN_PRIME => "B'",
            CubeMove::MIDDLE_TURN => "M",
            CubeMove::MIDDLE_TURN_DOUBLE => "M2",
            CubeMove::MIDDLE_TURN_PRIME => "M'",
            CubeMove::STANDING_TURN => "S",
            CubeMove::STANDING_TURN_DOUBLE => "S2",
            CubeMove::STANDING_TURN_PRIME => "S'",
            CubeMove::EQUATORIAL_TURN => "E",
            CubeMove::EQUATORIAL_TURN_DOUBLE => "E2",
            CubeMove::EQUATORIAL_TURN_PRIME => "E'",
            CubeMove::X_ROTATION => "X",
            CubeMove::X_ROTATION_PRIME => "X'",
            CubeMove::X_ROTATION_DOUBLE => "X2",
            CubeMove::Y_ROTATION => "Y",
            CubeMove::Y_ROTATION_PRIME => "Y'",
            CubeMove::Y_ROTATION_DOUBLE => "Y2",
            CubeMove::Z_ROTATION => "Z",
            CubeMove::Z_ROTATION_PRIME => "Z'",
            CubeMove::Z_ROTATION_DOUBLE => "Z2",
            CubeMove::RIGHT_WIDE_TURN => "r",
            CubeMove::RIGHT_WIDE_TURN_DOUBLE => "r2",
            CubeMove::RIGHT_WIDE_TURN_PRIME => "r'",
            CubeMove::UP_WIDE_TURN => "u",
            CubeMove::UP_WIDE_TURN_PRIME => "u'",
            CubeMove::UP_WIDE_TURN_DOUBLE => "u2",
            CubeMove::FRONT_WIDE_TURN => "f",
            CubeMove::FRONT_WIDE_TURN_DOUBLE => "f2",
            CubeMove::FRONT_WIDE_TURN_PRIME => "f'",
            CubeMove::DOWN_WIDE_TURN => "d",
            CubeMove::DOWN_WIDE_TURN_DOUBLE => "d2",
            CubeMove::DOWN_WIDE_TURN_PRIME => "d'",
            CubeMove::LEFT_WIDE_TURN => "l",
            CubeMove::LEFT_WIDE_TURN_DOUBLE => "l2",
            CubeMove::LEFT_WIDE_TURN_PRIME => "l'",
            CubeMove::BACK_WIDE_TURN => "b",
            CubeMove::BACK_WIDE_TURN_DOUBLE => "b2",
            CubeMove::BACK_WIDE_TURN_PRIME => "b'",
        };
        write!(f, "{}", s)
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_cube_move_display() {
        use super::CubeMove;

        let mv = CubeMove::RIGHT_TURN;
        assert_eq!(mv.to_string(), "R");

        let mv = CubeMove::UP_TURN_PRIME;
        assert_eq!(mv.to_string(), "U'");

        let mv = CubeMove::FRONT_WIDE_TURN_DOUBLE;
        assert_eq!(mv.to_string(), "f2");
    }
}
