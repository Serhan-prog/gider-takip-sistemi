package com.inonu.takip.repository;

import com.inonu.takip.model.DepositRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DepositRequestRepository extends JpaRepository<DepositRequest, Long> {

    List<DepositRequest> findByStatus(String status);


    List<DepositRequest> findByUserId(Long userId);
}