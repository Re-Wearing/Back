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
    void deletePost(Long postId, User author);
    Post getPostById(Long postId);
    List<Post> getPostsByType(PostType postType);
    Page<Post> getPostsByType(PostType postType, Pageable pageable);
    List<Post> getPostsByAuthorUser(User authorUser);
    List<Post> getPostsByAuthorOrgan(Long organId);
}