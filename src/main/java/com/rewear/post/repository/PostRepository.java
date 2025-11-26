package com.rewear.post.repository;

import com.rewear.common.enums.ClothType;
import com.rewear.common.enums.PostType;
import com.rewear.organ.entity.Organ;
import com.rewear.post.entity.Post;
import com.rewear.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    // 타입별 게시물 조회
    List<Post> findByPostType(PostType postType);
    Page<Post> findByPostType(PostType postType, Pageable pageable);

    // 작성자별 게시물 조회
    List<Post> findByAuthor(User author);
    List<Post> findByAuthorId(Long authorId);

    // 기관별 게시물 조회
    List<Post> findByOrgan(Organ organ);
    List<Post> findByOrganId(Long organId);

    // 타입과 작성자로 조회
    List<Post> findByPostTypeAndAuthor(PostType postType, User author);

    // 옷의 종류로 조회 (기관 요청 게시물)
    List<Post> findByPostTypeAndClothType(PostType postType, ClothType clothType);

    // 최신순 조회
    @Query("SELECT p FROM Post p WHERE p.postType = :postType ORDER BY p.createdAt DESC")
    List<Post> findByPostTypeOrderByCreatedAtDesc(@Param("postType") PostType postType);

    // 조회수 순 조회
    @Query("SELECT p FROM Post p WHERE p.postType = :postType ORDER BY p.viewCount DESC")
    List<Post> findByPostTypeOrderByViewCountDesc(@Param("postType") PostType postType);
}