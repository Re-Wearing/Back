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
import java.util.Optional;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    // 타입별 게시물 조회
    List<Post> findByPostType(PostType postType);
    Page<Post> findByPostType(PostType postType, Pageable pageable);

    // 작성자별 게시물 조회 (일반 회원)
    List<Post> findByAuthorUser(User authorUser);
    List<Post> findByAuthorUserId(Long authorUserId);

    // 작성자별 게시물 조회 (기관)
    List<Post> findByAuthorOrgan(Organ authorOrgan);
    List<Post> findByAuthorOrganId(Long authorOrganId);

    // 타입과 작성자로 조회 (일반 회원)
    List<Post> findByPostTypeAndAuthorUser(PostType postType, User authorUser);

    // 타입과 작성자로 조회 (기관)
    List<Post> findByPostTypeAndAuthorOrgan(PostType postType, Organ authorOrgan);

    // 요청 게시물 - 옷의 종류로 조회
    List<Post> findByPostTypeAndReqMainCategory(PostType postType, ClothType reqMainCategory);

    // 최신순 조회
    @Query("SELECT p FROM Post p WHERE p.postType = :postType ORDER BY p.createdAt DESC")
    List<Post> findByPostTypeOrderByCreatedAtDesc(@Param("postType") PostType postType);

    // 게시물 상세 조회 시 필요한 관계를 함께 로드
    @Query("SELECT p FROM Post p " +
           "LEFT JOIN FETCH p.authorUser " +
           "LEFT JOIN FETCH p.authorOrgan o " +
           "LEFT JOIN FETCH o.user " +
           "WHERE p.id = :postId")
    Optional<Post> findByIdWithAuthors(@Param("postId") Long postId);
}