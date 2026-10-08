package com.billing.pos.dto;

import lombok.Data;

@Data
public class NotificationDto {
    private String id;
    private String type; // CRITICAL, WARNING, INFO, SUCCESS
    private String title;
    private String message;
    private String actionLink; // Optional link
}
