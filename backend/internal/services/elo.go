package services

import "math"

const eloKFactor = 32

// CalculateElo вычисляет изменение рейтинга Elo после матча.
// playerRating, opponentRating - текущие рейтинги.
// playerWon - true если игрок выиграл, false если проиграл.
// Возвращает изменение рейтинга (может быть отрицательным).
func CalculateElo(playerRating, opponentRating int, playerWon bool) int {
	expected := 1.0 / (1.0 + math.Pow(10, float64(opponentRating-playerRating)/400.0))

	var actual float64
	if playerWon {
		actual = 1.0
	} else {
		actual = 0.0
	}

	change := int(math.Round(float64(eloKFactor) * (actual - expected)))
	return change
}
