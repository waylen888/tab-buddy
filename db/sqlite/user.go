package sqlite

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/georgysavva/scany/v2/sqlscan"
	"github.com/rs/xid"
	"github.com/waylen888/tab-buddy/db/entity"
	"golang.org/x/crypto/bcrypt"
)

func (s *sqlite) GetUserByUsername(username string) (entity.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), s.timeout)
	defer cancel()
	var user entity.User
	err := sqlscan.Get(
		ctx,
		s.rwDB,
		&user,
		`SELECT * FROM "user" WHERE username = @username`,
		sql.Named("username", username),
	)
	return user, err
}

func (s *sqlite) GetUser(ID string) (entity.User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), s.timeout)
	defer cancel()
	var user entity.User
	err := sqlscan.Get(
		ctx,
		s.rwDB,
		&user,
		`SELECT * FROM "user" WHERE id = @id`,
		sql.Named("id", ID),
	)
	return user, err
}

func (s *sqlite) CreateUser(username, displayName, email, password string, createType entity.UserCreateType) (entity.User, error) {
	if username == "" {
		return entity.User{}, fmt.Errorf("username is required")
	}
	if displayName == "" {
		return entity.User{}, fmt.Errorf("displayName is required")
	}
	if password == "" && createType == entity.UserCreateTypeDefault {
		return entity.User{}, fmt.Errorf("password is required")
	}

	ctx, cancel := context.WithTimeout(context.Background(), s.timeout)
	defer cancel()

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return entity.User{}, err
	}

	createAt := time.Now()
	user := entity.User{
		ID:          xid.NewWithTime(createAt).String(),
		Username:    username,
		DisplayName: displayName,
		Email:       email,
		CreateType:  createType,
		Password:    string(hashedPassword),
		CreateAt:    createAt,
	}

	_, err = s.rwDB.ExecContext(
		ctx,
		`INSERT INTO "user" (id, username, display_name, email, create_type, password, create_at, update_at) 
		VALUES (@id, @username, @display_name, @email, @create_type, @password, @create_at, @update_at)`,
		sql.Named("id", user.ID),
		sql.Named("username", user.Username),
		sql.Named("display_name", user.DisplayName),
		sql.Named("email", user.Email),
		sql.Named("create_type", user.CreateType),
		sql.Named("password", user.Password),
		sql.Named("create_at", user.CreateAt),
		sql.Named("update_at", user.UpdateAt),
	)
	return user, err
}

func (s *sqlite) GetUserSetting(ID string) (entity.UserSetting, error) {
	ctx, cancel := context.WithTimeout(context.Background(), s.timeout)
	defer cancel()
	var userSetting entity.UserSetting
	err := sqlscan.Get(
		ctx,
		s.rwDB,
		&userSetting,
		`SELECT theme_mode, push_notification FROM "user_setting" WHERE user_id = @id`,
		sql.Named("id", ID),
	)
	return userSetting, err
}

func (s *sqlite) UpdateUserSetting(userID string, themeMode *string, pushNotification *bool) (entity.UserSetting, error) {
	var setting entity.UserSetting
	err := s.WithTx(context.Background(), func(ctx context.Context, tx *sql.Tx) error {
		_, err := tx.ExecContext(
			ctx,
			`INSERT OR REPLACE INTO "user_setting" (user_id, theme_mode, push_notification)
			VALUES (
				@user_id,
				COALESCE(@theme_mode, (SELECT theme_mode FROM user_setting WHERE user_id = @user_id), ""),
				COALESCE(@push_notification, (SELECT push_notification FROM user_setting WHERE user_id = @user_id), 0)
			)`,
			sql.Named("user_id", userID),
			sql.Named("theme_mode", themeMode),
			sql.Named("push_notification", pushNotification),
		)
		return err
	})
	return setting, err
}
