package services

import (
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"time"

	"github.com/Dimanchick22/ProxyLeague/internal/models"
)

const (
	HoYoLabAPIURL = "https://sg-public-api.hoyolab.com/event/game_record_zzz/api/zzz/avatar/info"
)

type HoYoLabService struct {
	LTokenV2 string
	LTuidV2  string
	client   *http.Client
}

func NewHoYoLabService(lTokenV2, lTuidV2 string) *HoYoLabService {
	return &HoYoLabService{
		LTokenV2: lTokenV2,
		LTuidV2:  lTuidV2,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (s *HoYoLabService) GetAvatarInfo(server, roleID string, avatarID int) (*models.HoYoLabAvatarResponse, error) {
	url := fmt.Sprintf("%s?server=%s&role_id=%s&id_list[]=%d", HoYoLabAPIURL, server, roleID, avatarID)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("x-rpc-lang", "ru-ru")
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

	if s.LTokenV2 != "" && s.LTuidV2 != "" {
		req.AddCookie(&http.Cookie{Name: "ltoken_v2", Value: s.LTokenV2})
		req.AddCookie(&http.Cookie{Name: "ltuid_v2", Value: s.LTuidV2})
	}

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var result models.HoYoLabAvatarResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if result.Retcode != 0 {
		return nil, fmt.Errorf("API error: %s (code: %d)", result.Message, result.Retcode)
	}

	return &result, nil
}

func (s *HoYoLabService) FetchAllHeroes(server, roleID string, avatarIDs []int) ([]models.HoYoLabAvatar, error) {
	var allHeroes []models.HoYoLabAvatar

	for _, avatarID := range avatarIDs {
		delay := time.Duration(500+rand.Intn(1000)) * time.Millisecond
		time.Sleep(delay)

		response, err := s.GetAvatarInfo(server, roleID, avatarID)
		if err != nil {
			continue
		}

		if len(response.Data.AvatarList) > 0 {
			allHeroes = append(allHeroes, response.Data.AvatarList[0])
		}
	}

	return allHeroes, nil
}

func GetDefaultAvatarIDs() []int {
	return []int{
		1011, 1021, 1031, 1041, 1051, 1061, 1071, 1081, 1091, 1101,
		1111, 1121, 1131, 1141, 1151, 1161, 1171, 1181, 1191, 1201,
		1211, 1221, 1241, 1251, 1261, 1271, 1281, 1291, 1301, 1311,
		1321, 1331, 1351, 1361, 1371, 1381, 1391, 1401, 1411, 1421,
		1441, 1451, 1461, 1481,
	}
}
