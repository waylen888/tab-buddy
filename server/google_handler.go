package server

import (
	"database/sql"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/waylen888/tab-buddy/config"
	"github.com/waylen888/tab-buddy/db"
	"github.com/waylen888/tab-buddy/db/entity"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

type GoogleHandler struct {
	db  db.Database
	cfg *oauth2.Config
}

func NewGoogleHandler(db db.Database, oauthCfg config.GoogleOAuth) *GoogleHandler {
	return &GoogleHandler{
		db:  db,
		cfg: NewGoogleOAuthConfig(oauthCfg),
	}
}

func NewGoogleOAuthConfig(oauthCfg config.GoogleOAuth) *oauth2.Config {
	config := &oauth2.Config{
		ClientID:     oauthCfg.ClientID,
		ClientSecret: oauthCfg.ClientSecret,
		RedirectURL:  oauthCfg.RedirectURL,
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.profile",
			"https://www.googleapis.com/auth/userinfo.email",
		},
		Endpoint: google.Endpoint,
	}
	return config
}

func (h *GoogleHandler) Login(ctx *gin.Context) {
	const authCode = "I$#!lk(D_d1)"
	slog.Info("google login", "url", h.cfg.AuthCodeURL(authCode))
	ctx.Redirect(http.StatusFound, h.cfg.AuthCodeURL(authCode))
	ctx.Abort()
}

func (h *GoogleHandler) Callback(ctx *gin.Context) {
	code := ctx.Query("code")
	slog.Info("google callback", "code", code)
	token, err := h.cfg.Exchange(ctx.Request.Context(), code)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	req, err := http.NewRequestWithContext(ctx.Request.Context(),
		"GET",
		"https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,metadata",
		nil,
	)
	if err != nil {
		ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	token.SetAuthHeader(req)
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	defer res.Body.Close()

	var resp PeopleResponse
	if err := json.NewDecoder(res.Body).Decode(&resp); err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	// try login
	user, err := h.db.GetUserByUsername(resp.GetID())
	if err != nil && errors.Is(err, sql.ErrNoRows) {
		// create user
		user, err = h.db.CreateUser(resp.GetID(), resp.GetDisplayName(), resp.GetEmail(), "", entity.UserCreateTypeGoogle)
		if err != nil {
			ctx.AbortWithError(http.StatusInternalServerError, err)
			return
		}
	} else if err != nil {
		ctx.AbortWithError(http.StatusForbidden, err)
		return
	}

	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":       user.ID,
		"username": user.Username,
		"exp":      time.Now().Add(time.Hour * 24 * 30).Unix(),
	})
	tokenStr, err := jwtToken.SignedString([]byte(TOKEN_SECRET))
	if err != nil {
		ctx.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	ctx.Redirect(http.StatusFound, "/set-token?access_token="+tokenStr)
}

type PeopleResponse struct {
	EmailAddresses []EmailAddress `json:"emailAddresses"`
	Names          []Name         `json:"names"`
	Metadata       Metadata       `json:"metadata"`
}

func (r *PeopleResponse) GetEmail() string {
	if len(r.EmailAddresses) > 0 {
		return r.EmailAddresses[0].Value
	}
	return ""
}

func (r *PeopleResponse) GetDisplayName() string {
	if len(r.Names) > 0 {
		return r.Names[0].DisplayName
	}
	return ""
}

func (r *PeopleResponse) GetID() string {
	if len(r.Metadata.Sources) > 0 {
		return r.Metadata.Sources[0].ID
	}
	return ""
}

type EmailAddress struct {
	Value string `json:"value"`
}

type Name struct {
	DisplayName string `json:"displayName"`
	GivenName   string `json:"givenName"`
	FamilyName  string `json:"familyName"`
}

type Metadata struct {
	Sources []Source `json:"sources"`
}

type Source struct {
	Type string `json:"type"`
	ID   string `json:"id"`
}

// {
//   "etag": "%EgcBAgkuNz0+GgQBAgUHIgwwbWNlMTRsVFltMD0=",
//   "metadata": {
//     "objectType": "PERSON",
//     "sources": [
//       {
//         "etag": "#ML4Wui98gHw=",
//         "id": "113943641271207611320",
//         "profileMetadata": {
//           "objectType": "PERSON",
//           "userTypes": [
//             "GOOGLE_USER"
//           ]
//         },
//         "type": "PROFILE",
// {
//   "emailAddresses": [
//     {
//       "metadata": {
//         "primary": true,
//         "source": {
//           "id": "113943641271207611320",
//           "type": "ACCOUNT"
//         },
//         "sourcePrimary": true,
//         "verified": true
//       },
//       "value": "waylen888@gmail.com"
//     }
//   ],
//   "etag": "%EgcBAgkuNz0+GgQBAgUHIgwwbWNlMTRsVFltMD0=",
//   "metadata": {
//     "objectType": "PERSON",
//     "sources": [
//       {
//         "etag": "#ML4Wui98gHw=",
//         "id": "113943641271207611320",
//         "profileMetadata": {
//           "objectType": "PERSON",
//           "userTypes": [
//             "GOOGLE_USER"
//           ]
//         },
//         "type": "PROFILE",
//         "updateTime": "2024-05-03T09:38:52.008543Z"
//       }
//     ]
//   },
//   "names": [
//     {
//       "displayName": "WAYLEN FC",
//       "displayNameLastFirst": "FC, WAYLEN",
//       "familyName": "FC",
//       "givenName": "WAYLEN",
//       "metadata": {
//         "primary": true,
//         "source": {
//           "id": "113943641271207611320",
//           "type": "PROFILE"
//         },
//         "sourcePrimary": true
//       },
//       "unstructuredName": "WAYLEN FC"
//     }
//   ],
//   "resourceName": "people/113943641271207611320"
// }
