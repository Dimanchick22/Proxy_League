package tournament

import (
	"math"
	"math/rand"
	"time"

	"github.com/Dimanchick22/ProxyLeague/internal/models"
)

func init() {
	rand.Seed(time.Now().UnixNano())
}

func GenerateSingleEliminationBracket(t *models.Tournament) ([]models.Match, error) {
	participants := t.Participants
	rand.Shuffle(len(participants), func(i, j int) {
		participants[i], participants[j] = participants[j], participants[i]
	})

	var matches []models.Match
	round := 1

	for i := 0; i < len(participants); i += 2 {
		match := models.Match{
			TournamentID: t.ID,
			Round:        round,
			Player1ID:    participants[i].ID,
		}

		if i+1 < len(participants) {
			match.Player2ID = participants[i+1].ID
		} else {
			match.IsBye = true
			match.WinnerID = &participants[i].ID
		}

		matches = append(matches, match)
	}

	return matches, nil
}

func GenerateDoubleEliminationBracket(t *models.Tournament) ([]models.Match, error) {
	winnerMatches, err := GenerateSingleEliminationBracket(t)
	if err != nil {
		return nil, err
	}

	return winnerMatches, nil
}

func GenerateRoundRobinBracket(t *models.Tournament) ([]models.Match, error) {
	participants := t.Participants
	var matches []models.Match
	round := 1

	for i := 0; i < len(participants); i++ {
		for j := i + 1; j < len(participants); j++ {
			match := models.Match{
				TournamentID: t.ID,
				Round:        round,
				Player1ID:    participants[i].ID,
				Player2ID:    participants[j].ID,
			}
			matches = append(matches, match)
		}
	}

	return matches, nil
}

func CalculateNumberOfRounds(participantCount int, tournamentType models.TournamentType) int {
	switch tournamentType {
	case models.TypeSingleElimination:
		return int(math.Ceil(math.Log2(float64(participantCount))))
	case models.TypeDoubleElimination:
		return int(math.Ceil(math.Log2(float64(participantCount)))) * 2
	case models.TypeRoundRobin:
		return participantCount - 1
	default:
		return 0
	}
}
