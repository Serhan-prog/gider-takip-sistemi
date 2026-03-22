
package com.inonu.takip.repository;

import com.inonu.takip.model.BalanceLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BalanceLogRepository extends JpaRepository<BalanceLog, Long> {
    List<BalanceLog> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}