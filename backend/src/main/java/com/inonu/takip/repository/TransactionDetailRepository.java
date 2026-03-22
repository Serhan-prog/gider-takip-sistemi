package com.inonu.takip.repository;

import com.inonu.takip.model.TransactionDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Repository
public interface TransactionDetailRepository extends JpaRepository<TransactionDetail, Long> {

    List<TransactionDetail> findByUserId(Long userId);


    List<TransactionDetail> findByUserIdOrderByTransactionCreatedAtDesc(Long userId);

    @Modifying
    @Transactional
    void deleteByUserId(Long userId);
}