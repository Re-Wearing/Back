package com.rewear.post.service;

import com.rewear.common.enums.PostType;
import com.rewear.post.PostForm;
import com.rewear.post.entity.Post;
import com.rewear.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface PostService {
    Post createPost(User author, PostForm form, MultipartFile image);
    Post updatePost(Long postId, User author, PostForm form, MultipartFile image);
    Post updatePostByAdmin(Long postId, PostForm form, MultipartFile image); // 관리자용 수정 (작성자 확인 없이)
    void deletePost(Long postId, User author);
    void deletePostByAdmin(Long postId); // 관리자용 삭제 (작성자 확인 없이)
    Post getPostById(Long postId);
    List<Post> getAllPosts(); // 모든 게시물 조회 (관리자용)
    List<Post> getPostsByType(PostType postType);
    Page<Post> getPostsByType(PostType postType, Pageable pageable);
    List<Post> getPostsByAuthorUser(User authorUser);
    List<Post> getPostsByAuthorOrgan(Long organId);
}