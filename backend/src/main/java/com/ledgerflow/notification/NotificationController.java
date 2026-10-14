package com.ledgerflow.notification;

import com.ledgerflow.common.response.ApiResponse;
import com.ledgerflow.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class NotificationController {
    private final NotificationRepository notificationRepository;

    public NotificationController(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse<List<Notification>>> getNotifications(@AuthenticationPrincipal UserPrincipal principal) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(principal.getUser().getId());
        return ResponseEntity.ok(ApiResponse.success("Notifications fetched", notifications));
    }
}
