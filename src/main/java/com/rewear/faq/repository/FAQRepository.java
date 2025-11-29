package com.rewear.faq.repository;

import com.rewear.faq.entity.FAQ;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FAQRepository extends JpaRepository<FAQ, Long> {
    List<FAQ> findByIsActiveTrueOrderByDisplayOrderAsc();
    List<FAQ> findByCategoryAndIsActiveTrueOrderByDisplayOrderAsc(String category);
    List<FAQ> findByIsActiveTrueOrderByCategoryAscDisplayOrderAsc();
}