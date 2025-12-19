use std::str::FromStr;

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum CubeMove {
    /// Right face clockwise 90° (R)
    RightTurn,
    /// Right face clockwise 180° (R2)
    RightTurnDouble,
    /// Right face counter-clockwise 90° (R')
    RightTurnPrime,
    /// Up face clockwise 90° (U)
    UpTurn,
    /// Up face counter-clockwise 90° (U')
    UpTurnPrime,
    /// Up face clockwise 180° (U2)
    UpTurnDouble,
    /// Front face clockwise 90° (F)
    FrontTurn,
    /// Front face clockwise 180° (F2)
    FrontTurnDouble,
    /// Front face counter-clockwise 90° (F')
    FrontTurnPrime,
    /// Down face clockwise 90° (D)
    DownTurn,
    /// Down face clockwise 180° (D2)
    DownTurnDouble,
    /// Down face counter-clockwise 90° (D')
    DownTurnPrime,
    /// Left face clockwise 90° (L)
    LeftTurn,
    /// Left face clockwise 180° (L2)
    LeftTurnDouble,
    /// Left face counter-clockwise 90° (L')
    LeftTurnPrime,
    /// Back face clockwise 90° (B)
    BackTurn,
    /// Back face clockwise 180° (B2)
    BackTurnDouble,
    /// Back face counter-clockwise 90° (B')
    BackTurnPrime,
    /// Middle slice (between L and R) 90° (M)
    MiddleTurn,
    /// Middle slice (between L and R) 180° (M2)
    MiddleTurnDouble,
    /// Middle slice (between L and R) counter-clockwise 90° (M')
    MiddleTurnPrime,
    /// Standing slice (between F and B) 90° (S)
    StandingTurn,
    /// Standing slice (between F and B) 180° (S2)
    StandingTurnDouble,
    /// Standing slice (between F and B) counter-clockwise 90° (S')
    StandingTurnPrime,
    /// Equatorial slice (between U and D) 90° (E)
    EquatorialTurn,
    /// Equatorial slice (between U and D) 180° (E2)
    EquatorialTurnDouble,
    /// Equatorial slice (between U and D) counter-clockwise 90° (E')
    EquatorialTurnPrime,
    /// Rotate entire cube on R axis clockwise 90° (X)
    XRotation,
    /// Rotate entire cube on R axis counter-clockwise 90° (X')
    XRotationPrime,
    /// Rotate entire cube on R axis 180° (X2)
    XRotationDouble,
    /// Rotate entire cube on U axis clockwise 90° (Y)
    YRotation,
    /// Rotate entire cube on U axis counter-clockwise 90° (Y')
    YRotationPrime,
    /// Rotate entire cube on U axis 180° (Y2)
    YRotationDouble,
    /// Rotate entire cube on F axis clockwise 90° (Z)
    ZRotation,
    /// Rotate entire cube on F axis counter-clockwise 90° (Z')
    ZRotationPrime,
    /// Rotate entire cube on F axis 180° (Z2)
    ZRotationDouble,
    /// Right two layers clockwise 90° (r)
    RightWideTurn,
    /// Right two layers clockwise 180° (r2)
    RightWideTurnDouble,
    /// Right two layers counter-clockwise 90° (r')
    RightWideTurnPrime,
    /// Up two layers clockwise 90° (u)
    UpWideTurn,
    /// Up two layers counter-clockwise 90° (u')
    UpWideTurnPrime,
    /// Up two layers clockwise 180° (u2)
    UpWideTurnDouble,
    /// Front two layers clockwise 90° (f)
    FrontWideTurn,
    /// Front two layers clockwise 180° (f2)
    FrontWideTurnDouble,
    /// Front two layers counter-clockwise 90° (f')
    FrontWideTurnPrime,
    /// Down two layers clockwise 90° (d)
    DownWideTurn,
    /// Down two layers clockwise 180° (d2)
    DownWideTurnDouble,
    /// Down two layers counter-clockwise 90° (d')
    DownWideTurnPrime,
    /// Left two layers clockwise 90° (l)
    LeftWideTurn,
    /// Left two layers clockwise 180° (l2)
    LeftWideTurnDouble,
    /// Left two layers counter-clockwise 90° (l')
    LeftWideTurnPrime,
    /// Back two layers clockwise 90° (b)
    BackWideTurn,
    /// Back two layers clockwise 180° (b2)
    BackWideTurnDouble,
    /// Back two layers counter-clockwise 90° (b')
    BackWideTurnPrime,
}

impl FromStr for CubeMove {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "R" => Some(CubeMove::RightTurn),
            "R2" => Some(CubeMove::RightTurnDouble),
            "R'" => Some(CubeMove::RightTurnPrime),
            "U" => Some(CubeMove::UpTurn),
            "U'" => Some(CubeMove::UpTurnPrime),
            "U2" => Some(CubeMove::UpTurnDouble),
            "F" => Some(CubeMove::FrontTurn),
            "F2" => Some(CubeMove::FrontTurnDouble),
            "F'" => Some(CubeMove::FrontTurnPrime),
            "D" => Some(CubeMove::DownTurn),
            "D2" => Some(CubeMove::DownTurnDouble),
            "D'" => Some(CubeMove::DownTurnPrime),
            "L" => Some(CubeMove::LeftTurn),
            "L2" => Some(CubeMove::LeftTurnDouble),
            "L'" => Some(CubeMove::LeftTurnPrime),
            "B" => Some(CubeMove::BackTurn),
            "B2" => Some(CubeMove::BackTurnDouble),
            "B'" => Some(CubeMove::BackTurnPrime),
            "M" => Some(CubeMove::MiddleTurn),
            "M2" => Some(CubeMove::MiddleTurnDouble),
            "M'" => Some(CubeMove::MiddleTurnPrime),
            "S" => Some(CubeMove::StandingTurn),
            "S2" => Some(CubeMove::StandingTurnDouble),
            "S'" => Some(CubeMove::StandingTurnPrime),
            "E" => Some(CubeMove::EquatorialTurn),
            "E2" => Some(CubeMove::EquatorialTurnDouble),
            "E'" => Some(CubeMove::EquatorialTurnPrime),
            "X" => Some(CubeMove::XRotation),
            "X'" => Some(CubeMove::XRotationPrime),
            "X2" => Some(CubeMove::XRotationDouble),
            "Y" => Some(CubeMove::YRotation),
            "Y'" => Some(CubeMove::YRotationPrime),
            "Y2" => Some(CubeMove::YRotationDouble),
            "Z" => Some(CubeMove::ZRotation),
            "Z'" => Some(CubeMove::ZRotationPrime),
            "Z2" => Some(CubeMove::ZRotationDouble),
            // Wide CubeMoves
            "r" => Some(CubeMove::RightWideTurn),
            "r2" => Some(CubeMove::RightWideTurnDouble),
            "r'" => Some(CubeMove::RightWideTurnPrime),
            "u" => Some(CubeMove::UpWideTurn),
            "u'" => Some(CubeMove::UpWideTurnPrime),
            "u2" => Some(CubeMove::UpWideTurnDouble),
            "f" => Some(CubeMove::FrontWideTurn),
            "f2" => Some(CubeMove::FrontWideTurnDouble),
            "f'" => Some(CubeMove::FrontWideTurnPrime),
            "d" => Some(CubeMove::DownWideTurn),
            "d2" => Some(CubeMove::DownWideTurnDouble),
            "d'" => Some(CubeMove::DownWideTurnPrime),
            "l" => Some(CubeMove::LeftWideTurn),
            "l2" => Some(CubeMove::LeftWideTurnDouble),
            "l'" => Some(CubeMove::LeftWideTurnPrime),
            "b" => Some(CubeMove::BackWideTurn),
            "b2" => Some(CubeMove::BackWideTurnDouble),
            "b'" => Some(CubeMove::BackWideTurnPrime),
            _ => None,
        }
        .ok_or(())
    }
}

impl std::fmt::Display for CubeMove {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s = match self {
            CubeMove::RightTurn => "R",
            CubeMove::RightTurnDouble => "R2",
            CubeMove::RightTurnPrime => "R'",
            CubeMove::UpTurn => "U",
            CubeMove::UpTurnPrime => "U'",
            CubeMove::UpTurnDouble => "U2",
            CubeMove::FrontTurn => "F",
            CubeMove::FrontTurnDouble => "F2",
            CubeMove::FrontTurnPrime => "F'",
            CubeMove::DownTurn => "D",
            CubeMove::DownTurnDouble => "D2",
            CubeMove::DownTurnPrime => "D'",
            CubeMove::LeftTurn => "L",
            CubeMove::LeftTurnDouble => "L2",
            CubeMove::LeftTurnPrime => "L'",
            CubeMove::BackTurn => "B",
            CubeMove::BackTurnDouble => "B2",
            CubeMove::BackTurnPrime => "B'",
            CubeMove::MiddleTurn => "M",
            CubeMove::MiddleTurnDouble => "M2",
            CubeMove::MiddleTurnPrime => "M'",
            CubeMove::StandingTurn => "S",
            CubeMove::StandingTurnDouble => "S2",
            CubeMove::StandingTurnPrime => "S'",
            CubeMove::EquatorialTurn => "E",
            CubeMove::EquatorialTurnDouble => "E2",
            CubeMove::EquatorialTurnPrime => "E'",
            CubeMove::XRotation => "X",
            CubeMove::XRotationPrime => "X'",
            CubeMove::XRotationDouble => "X2",
            CubeMove::YRotation => "Y",
            CubeMove::YRotationPrime => "Y'",
            CubeMove::YRotationDouble => "Y2",
            CubeMove::ZRotation => "Z",
            CubeMove::ZRotationPrime => "Z'",
            CubeMove::ZRotationDouble => "Z2",
            CubeMove::RightWideTurn => "r",
            CubeMove::RightWideTurnDouble => "r2",
            CubeMove::RightWideTurnPrime => "r'",
            CubeMove::UpWideTurn => "u",
            CubeMove::UpWideTurnPrime => "u'",
            CubeMove::UpWideTurnDouble => "u2",
            CubeMove::FrontWideTurn => "f",
            CubeMove::FrontWideTurnDouble => "f2",
            CubeMove::FrontWideTurnPrime => "f'",
            CubeMove::DownWideTurn => "d",
            CubeMove::DownWideTurnDouble => "d2",
            CubeMove::DownWideTurnPrime => "d'",
            CubeMove::LeftWideTurn => "l",
            CubeMove::LeftWideTurnDouble => "l2",
            CubeMove::LeftWideTurnPrime => "l'",
            CubeMove::BackWideTurn => "b",
            CubeMove::BackWideTurnDouble => "b2",
            CubeMove::BackWideTurnPrime => "b'",
        };
        write!(f, "{}", s)
    }
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_cube_move_display() {
        use super::CubeMove;

        let mv = CubeMove::RightTurn;
        assert_eq!(mv.to_string(), "R");

        let mv = CubeMove::UpTurnPrime;
        assert_eq!(mv.to_string(), "U'");

        let mv = CubeMove::FrontWideTurnDouble;
        assert_eq!(mv.to_string(), "f2");
    }
}
