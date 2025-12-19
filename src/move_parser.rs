use std::str::FromStr;

use crate::cube_move::CubeMove;

pub(crate) struct MoveParser<I> {
    pub(crate) iter: I,
}

impl<I> MoveParser<I> {
    pub(crate) fn new(iter: I) -> Self {
        MoveParser { iter }
    }
}

#[derive(Debug, thiserror::Error)]
pub enum MoveParseError {
    #[error("Invalid move: {0}")]
    InvalidMove(String),
}

impl<I> Iterator for MoveParser<I>
where
    I: Iterator,
    I::Item: AsRef<str>,
{
    type Item = Result<CubeMove, MoveParseError>;

    fn next(&mut self) -> Option<Self::Item> {
        let item = self.iter.next()?;

        Some(
            CubeMove::from_str(item.as_ref())
                .map_err(|_| MoveParseError::InvalidMove(item.as_ref().to_owned())),
        )
    }
}

pub(crate) fn parse_moves<I>(iter: I) -> MoveParser<I::IntoIter>
where
    I: IntoIterator,
    I::Item: AsRef<str>,
{
    MoveParser::new(iter.into_iter())
}

#[cfg(test)]
mod tests {
    use crate::{
        cube_move::CubeMove,
        move_parser::{MoveParseError, parse_moves},
    };

    #[test]
    fn test_parse_basic_moves() {
        let moves = vec!["R", "U'", "F2", "D", "L'", "B2"];
        let parsed_moves: Vec<Result<CubeMove, MoveParseError>> = parse_moves(moves).collect();

        assert_eq!(parsed_moves.len(), 6);
        assert!(parsed_moves.iter().all(|m| m.is_ok()));
        assert_eq!(parsed_moves[0].as_ref().unwrap(), &CubeMove::RIGHT_TURN);
        assert_eq!(parsed_moves[1].as_ref().unwrap(), &CubeMove::UP_TURN_PRIME);
        assert_eq!(
            parsed_moves[2].as_ref().unwrap(),
            &CubeMove::FRONT_TURN_DOUBLE
        );
    }

    #[test]
    fn test_parse_split() {
        let moves = "R U' F2 D L' B2";
        let parsed_moves: Vec<_> = parse_moves(moves.split_whitespace())
            .collect::<Result<Vec<_>, _>>()
            .unwrap();

        assert_eq!(parsed_moves.len(), 6);
        assert_eq!(parsed_moves[0], CubeMove::RIGHT_TURN);
        assert_eq!(parsed_moves[1], CubeMove::UP_TURN_PRIME);
    }

    #[test]
    fn test_all_face_turns() {
        // Test all 6 faces with basic, double, and prime
        let moves = "R R2 R' U U2 U' F F2 F' D D2 D' L L2 L' B B2 B'";
        let parsed: Vec<_> = parse_moves(moves.split_whitespace())
            .collect::<Result<Vec<_>, _>>()
            .unwrap();

        assert_eq!(parsed.len(), 18);
        assert_eq!(parsed[0], CubeMove::RIGHT_TURN);
        assert_eq!(parsed[1], CubeMove::RIGHT_TURN_DOUBLE);
        assert_eq!(parsed[2], CubeMove::RIGHT_TURN_PRIME);
        assert_eq!(parsed[3], CubeMove::UP_TURN);
        assert_eq!(parsed[6], CubeMove::FRONT_TURN);
        assert_eq!(parsed[9], CubeMove::DOWN_TURN);
        assert_eq!(parsed[12], CubeMove::LEFT_TURN);
        assert_eq!(parsed[15], CubeMove::BACK_TURN);
    }

    #[test]
    fn test_slice_moves() {
        let moves = "M M2 M' S S2 S' E E2 E'";
        let parsed: Vec<_> = parse_moves(moves.split_whitespace())
            .collect::<Result<Vec<_>, _>>()
            .unwrap();

        assert_eq!(parsed.len(), 9);
        assert_eq!(parsed[0], CubeMove::MIDDLE_TURN);
        assert_eq!(parsed[1], CubeMove::MIDDLE_TURN_DOUBLE);
        assert_eq!(parsed[2], CubeMove::MIDDLE_TURN_PRIME);
        assert_eq!(parsed[3], CubeMove::STANDING_TURN);
        assert_eq!(parsed[6], CubeMove::EQUATORIAL_TURN);
    }

    #[test]
    fn test_rotations() {
        let moves = "X X' X2 Y Y' Y2 Z Z' Z2";
        let parsed: Vec<_> = parse_moves(moves.split_whitespace())
            .collect::<Result<Vec<_>, _>>()
            .unwrap();

        assert_eq!(parsed.len(), 9);
        assert_eq!(parsed[0], CubeMove::X_ROTATION);
        assert_eq!(parsed[1], CubeMove::X_ROTATION_PRIME);
        assert_eq!(parsed[2], CubeMove::X_ROTATION_DOUBLE);
        assert_eq!(parsed[3], CubeMove::Y_ROTATION);
        assert_eq!(parsed[6], CubeMove::Z_ROTATION);
    }

    #[test]
    fn test_wide_moves() {
        let moves = "r r2 r' u u2 u' f f2 f' d d2 d' l l2 l' b b2 b'";
        let parsed: Vec<_> = parse_moves(moves.split_whitespace())
            .collect::<Result<Vec<_>, _>>()
            .unwrap();

        assert_eq!(parsed.len(), 18);
        assert_eq!(parsed[0], CubeMove::RIGHT_WIDE_TURN);
        assert_eq!(parsed[1], CubeMove::RIGHT_WIDE_TURN_DOUBLE);
        assert_eq!(parsed[2], CubeMove::RIGHT_WIDE_TURN_PRIME);
        assert_eq!(parsed[3], CubeMove::UP_WIDE_TURN);
        assert_eq!(parsed[6], CubeMove::FRONT_WIDE_TURN);
        assert_eq!(parsed[9], CubeMove::DOWN_WIDE_TURN);
        assert_eq!(parsed[12], CubeMove::LEFT_WIDE_TURN);
        assert_eq!(parsed[15], CubeMove::BACK_WIDE_TURN);
    }

    #[test]
    fn test_comprehensive_sequence() {
        // A sequence containing at least one of every move type
        let moves = "R U F D L B M S E X Y Z r u f d l b R2 U' F' D2 L' B' M2 S' E' X' Y2 Z' r2 u' f' d2 l' b'";
        let parsed: Vec<_> = parse_moves(moves.split_whitespace())
            .collect::<Result<Vec<_>, _>>()
            .unwrap();

        assert_eq!(parsed.len(), 36);
        assert!(parsed.contains(&CubeMove::RIGHT_TURN));
        assert!(parsed.contains(&CubeMove::UP_TURN));
        assert!(parsed.contains(&CubeMove::FRONT_TURN));
        assert!(parsed.contains(&CubeMove::DOWN_TURN));
        assert!(parsed.contains(&CubeMove::LEFT_TURN));
        assert!(parsed.contains(&CubeMove::BACK_TURN));
        assert!(parsed.contains(&CubeMove::MIDDLE_TURN));
        assert!(parsed.contains(&CubeMove::STANDING_TURN));
        assert!(parsed.contains(&CubeMove::EQUATORIAL_TURN));
        assert!(parsed.contains(&CubeMove::X_ROTATION));
        assert!(parsed.contains(&CubeMove::Y_ROTATION));
        assert!(parsed.contains(&CubeMove::Z_ROTATION));
        assert!(parsed.contains(&CubeMove::RIGHT_WIDE_TURN));
        assert!(parsed.contains(&CubeMove::UP_WIDE_TURN));
        assert!(parsed.contains(&CubeMove::FRONT_WIDE_TURN));
        assert!(parsed.contains(&CubeMove::DOWN_WIDE_TURN));
        assert!(parsed.contains(&CubeMove::LEFT_WIDE_TURN));
        assert!(parsed.contains(&CubeMove::BACK_WIDE_TURN));
    }

    #[test]
    fn test_invalid_move() {
        let moves = vec!["R", "INVALID", "U"];
        let parsed: Vec<Result<CubeMove, MoveParseError>> = parse_moves(moves).collect();

        assert_eq!(parsed.len(), 3);
        assert!(parsed[0].is_ok());
        assert!(parsed[1].is_err());
        assert!(parsed[2].is_ok());

        if let Err(MoveParseError::InvalidMove(m)) = &parsed[1] {
            assert_eq!(m, "INVALID");
        } else {
            panic!("Expected InvalidMove error");
        }
    }

    #[test]
    fn test_empty_input() {
        let moves: Vec<&str> = vec![];
        let parsed: Vec<_> = parse_moves(moves).collect();
        assert_eq!(parsed.len(), 0);
    }

    #[test]
    fn test_iterator_chain() {
        let moves = "R U R' U'";
        let count = parse_moves(moves.split_whitespace())
            .filter(|m| m.is_ok())
            .count();

        assert_eq!(count, 4);
    }

    #[test]
    fn test_mixed_valid_invalid() {
        let moves = "R WRONG U' ALSO_WRONG F2";
        let results: Vec<_> = parse_moves(moves.split_whitespace()).collect();

        assert_eq!(results.len(), 5);
        assert!(results[0].is_ok());
        assert!(results[1].is_err());
        assert!(results[2].is_ok());
        assert!(results[3].is_err());
        assert!(results[4].is_ok());
    }

    #[test]
    fn test_case_sensitivity() {
        let moves = "r R";
        let parsed: Vec<_> = parse_moves(moves.split_whitespace())
            .collect::<Result<Vec<_>, _>>()
            .unwrap();

        assert_eq!(parsed.len(), 2);
        assert_eq!(parsed[0], CubeMove::RIGHT_WIDE_TURN);
        assert_eq!(parsed[1], CubeMove::RIGHT_TURN);
        assert_ne!(parsed[0], parsed[1]);
    }
}
