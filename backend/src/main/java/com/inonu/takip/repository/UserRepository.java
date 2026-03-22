package com.inonu.takip.repository;

import com.inonu.takip.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByUsernameAndEnabledTrue(String username);

    @Query("""
        SELECT 
            (COALESCE((SELECT SUM(bl.amountAdded) FROM BalanceLog bl WHERE bl.user.id = :userId), 0) - 
             COALESCE((SELECT SUM(td.amountPaid) FROM TransactionDetail td WHERE td.user.id = :userId), 0))
        """)
    BigDecimal calculateCurrentBalance(@Param("userId") Long userId);

    List<User> findAllByEnabledTrue();

    Optional<User> findByEmail(String email);

    Optional<User> findByResetPasswordToken(String token);


    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.resetPasswordToken = null, u.resetPasswordTokenExpiry = null " +
            "WHERE u.resetPasswordTokenExpiry < :now AND u.resetPasswordToken IS NOT NULL")
    void clearExpiredTokens(@Param("now") LocalDateTime now);
}