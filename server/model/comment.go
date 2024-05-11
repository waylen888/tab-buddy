package model

import "time"

type Comment struct {
	ID          string    `json:"id"`
	Content     string    `json:"content"`
	CreateBy    string    `json:"createBy"`
	DisplayName string    `json:"displayName"`
	CreateAt    time.Time `json:"createAt"`
	UpdateAt    time.Time `json:"updateAt"`
}
