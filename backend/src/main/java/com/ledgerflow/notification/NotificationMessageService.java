package com.ledgerflow.notification;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationMessageService {
    private final NotificationRepository notificationRepository;

    public NotificationMessageService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public Notification notifyUser(Long userId, Long transactionId, String message) {
        Notification notification = new Notification(userId, transactionId, message);
        return notificationRepository.save(notification);
    }
}
