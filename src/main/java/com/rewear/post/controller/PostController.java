package com.rewear.post.controller;

import com.rewear.common.enums.PostType;
import com.rewear.post.PostForm;
import com.rewear.post.entity.Post;
import com.rewear.post.service.PostService;
import com.rewear.user.details.CustomUserDetails;
import com.rewear.user.entity.User;
import com.rewear.user.service.UserServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;

@Controller
@RequestMapping("/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final UserServiceImpl userService;

    // 게시물 목록 (타입별)
    @GetMapping
    public String postList(
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            Model model) {

        PostType postType = null;
        if (type != null && !type.isEmpty()) {
            try {
                postType = PostType.valueOf(type.toUpperCase());
            } catch (IllegalArgumentException e) {
                // 타입이 잘못된 경우 전체 조회
            }
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        if (postType != null) {
            Page<Post> posts = postService.getPostsByType(postType, pageable);
            model.addAttribute("posts", posts);
            model.addAttribute("postType", postType);
        } else {
            // 전체 게시물 조회
            Page<Post> allPosts = postService.getPostsByType(PostType.DONATION_REVIEW, pageable);
            model.addAttribute("posts", allPosts);
            model.addAttribute("postType", PostType.DONATION_REVIEW);
        }

        return "post/list";
    }

    // 기부 후기 목록
    @GetMapping("/reviews")
    public String reviewList(Model model) {
        List<Post> reviews = postService.getPostsByType(PostType.DONATION_REVIEW);
        model.addAttribute("posts", reviews);
        model.addAttribute("postType", PostType.DONATION_REVIEW);
        return "post/list";
    }

    // 기관 요청 목록
    @GetMapping("/requests")
    @PreAuthorize("hasRole('ORGAN')")
    public String requestList(Model model) {
        List<Post> requests = postService.getPostsByType(PostType.ORGAN_REQUEST);
        model.addAttribute("posts", requests);
        model.addAttribute("postType", PostType.ORGAN_REQUEST);
        return "post/list";
    }

    // 게시물 상세 조회
    @GetMapping("/{postId}")
    public String postDetail(@PathVariable Long postId, Model model) {
        Post post = postService.getPostByIdAndIncrementView(postId);
        model.addAttribute("post", post);
        return "post/detail";
    }

    // 게시물 작성 폼
    @GetMapping("/new")
    public String postForm(
            @RequestParam("type") String type,
            @ModelAttribute("form") PostForm form,
            Model model,
            @AuthenticationPrincipal CustomUserDetails principal,
            RedirectAttributes redirectAttributes) {
        
        // 로그인 체크
        if (principal == null) {
            redirectAttributes.addFlashAttribute("error", "로그인이 필요합니다.");
            return "redirect:/login";
        }
        
        try {
            PostType postType = PostType.valueOf(type.toUpperCase());
            
            // 기관 요청 게시물 작성은 기관만 가능
            if (postType == PostType.ORGAN_REQUEST) {
                boolean hasOrganRole = principal.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_ORGAN"));
                if (!hasOrganRole) {
                    redirectAttributes.addFlashAttribute("error", "기관 요청 게시물은 기관 회원만 작성할 수 있습니다.");
                    return "redirect:/posts/requests";
                }
            }
            
            form.setPostType(postType);
            model.addAttribute("postType", postType);
            return "post/new";
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("error", "잘못된 게시물 타입입니다.");
            return "redirect:/posts";
        }
    }

    // 게시물 작성
    @PostMapping
    public String createPost(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @ModelAttribute("form") PostForm form,
            BindingResult bindingResult,
            Model model,
            RedirectAttributes redirectAttributes) {

        // 로그인 체크
        if (principal == null) {
            redirectAttributes.addFlashAttribute("error", "로그인이 필요합니다.");
            return "redirect:/login";
        }

        // 기관 요청 게시물 작성은 기관만 가능
        if (form.getPostType() == PostType.ORGAN_REQUEST) {
            boolean hasOrganRole = principal.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ORGAN"));
            if (!hasOrganRole) {
                redirectAttributes.addFlashAttribute("error", "기관 요청 게시물은 기관 회원만 작성할 수 있습니다.");
                return "redirect:/posts/requests";
            }
        }

        if (bindingResult.hasErrors()) {
            model.addAttribute("postType", form.getPostType());
            return "post/new";
        }

        User author = userService.findByUsername(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

        try {
            postService.createPost(author, form, form.getImage());
            redirectAttributes.addFlashAttribute("success", "게시물이 작성되었습니다.");
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
            model.addAttribute("postType", form.getPostType());
            return "post/new";
        }

        if (form.getPostType() == PostType.DONATION_REVIEW) {
            return "redirect:/posts/reviews";
        } else {
            return "redirect:/posts/requests";
        }
    }

    // 게시물 수정 폼
    @GetMapping("/{postId}/edit")
    public String editForm(
            @PathVariable Long postId,
            @AuthenticationPrincipal CustomUserDetails principal,
            Model model) {

        Post post = postService.getPostById(postId);
        User user = userService.findByUsername(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

        // 작성자 확인
        if (!post.getAuthor().getId().equals(user.getId())) {
            return "redirect:/posts/" + postId;
        }

        PostForm form = new PostForm();
        form.setPostType(post.getPostType());
        form.setTitle(post.getTitle());
        form.setContent(post.getContent());
        form.setClothType(post.getClothType());
        form.setQuantity(post.getQuantity());

        model.addAttribute("form", form);
        model.addAttribute("post", post);
        model.addAttribute("postType", post.getPostType());

        return "post/edit";
    }

    // 게시물 수정
    @PostMapping("/{postId}/edit")
    public String updatePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @ModelAttribute("form") PostForm form,
            BindingResult bindingResult,
            Model model,
            RedirectAttributes redirectAttributes) {

        if (bindingResult.hasErrors()) {
            Post post = postService.getPostById(postId);
            model.addAttribute("post", post);
            model.addAttribute("postType", form.getPostType());
            return "post/edit";
        }

        User author = userService.findByUsername(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

        postService.updatePost(postId, author, form, form.getImage());

        redirectAttributes.addFlashAttribute("success", "게시물이 수정되었습니다.");
        return "redirect:/posts/" + postId;
    }

    // 게시물 삭제
    @PostMapping("/{postId}/delete")
    public String deletePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal CustomUserDetails principal,
            RedirectAttributes redirectAttributes) {

        User author = userService.findByUsername(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

        Post post = postService.getPostById(postId);
        PostType postType = post.getPostType();

        postService.deletePost(postId, author);

        redirectAttributes.addFlashAttribute("success", "게시물이 삭제되었습니다.");

        if (postType == PostType.DONATION_REVIEW) {
            return "redirect:/posts/reviews";
        } else {
            return "redirect:/posts/requests";
        }
    }
}