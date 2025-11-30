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
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;

@Slf4j
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
        try {
            log.debug("게시물 목록 조회 요청 - 타입: {}, 페이지: {}, 크기: {}", type, page, size);
            
            PostType postType = null;
            if (type != null && !type.isEmpty()) {
                try {
                    postType = PostType.valueOf(type.toUpperCase());
                } catch (IllegalArgumentException e) {
                    log.warn("잘못된 게시물 타입: {}", type, e);
                    // 타입이 잘못된 경우 전체 조회
                }
            }

            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

            if (postType != null) {
                Page<Post> posts = postService.getPostsByType(postType, pageable);
                model.addAttribute("posts", posts);
                model.addAttribute("postType", postType);
                log.debug("게시물 목록 조회 완료 - 타입: {}, 개수: {}", postType, posts.getTotalElements());
            } else {
                // 전체 게시물 조회
                Page<Post> allPosts = postService.getPostsByType(PostType.DONATION_REVIEW, pageable);
                model.addAttribute("posts", allPosts);
                model.addAttribute("postType", PostType.DONATION_REVIEW);
                log.debug("게시물 목록 조회 완료 - 전체, 개수: {}", allPosts.getTotalElements());
            }

            return "post/list";
        } catch (Exception e) {
            log.error("게시물 목록 조회 실패 - 타입: {}, 페이지: {}", type, page, e);
            model.addAttribute("error", "게시물 목록을 불러오는 중 오류가 발생했습니다: " + e.getMessage());
            model.addAttribute("posts", Page.empty());
            return "post/list";
        }
    }

    // 기부 후기 목록
    @GetMapping("/reviews")
    public String reviewList(Model model) {
        try {
            log.debug("기부 후기 목록 조회 요청");
            List<Post> reviews = postService.getPostsByType(PostType.DONATION_REVIEW);
            model.addAttribute("posts", reviews);
            model.addAttribute("postType", PostType.DONATION_REVIEW);
            log.debug("기부 후기 목록 조회 완료 - 개수: {}", reviews.size());
            return "post/list";
        } catch (Exception e) {
            log.error("기부 후기 목록 조회 실패", e);
            model.addAttribute("error", "기부 후기 목록을 불러오는 중 오류가 발생했습니다: " + e.getMessage());
            model.addAttribute("posts", List.<Post>of());
            return "post/list";
        }
    }

    // 기관 요청 목록
    @GetMapping("/requests")
    public String requestList(Model model) {
        try {
            log.debug("기관 요청 목록 조회 요청");
            List<Post> requests = postService.getPostsByType(PostType.ORGAN_REQUEST);
            model.addAttribute("posts", requests);
            model.addAttribute("postType", PostType.ORGAN_REQUEST);
            log.debug("기관 요청 목록 조회 완료 - 개수: {}", requests.size());
            return "post/list";
        } catch (Exception e) {
            log.error("기관 요청 목록 조회 실패", e);
            model.addAttribute("error", "기관 요청 목록을 불러오는 중 오류가 발생했습니다: " + e.getMessage());
            model.addAttribute("posts", List.<Post>of());
            return "post/list";
        }
    }

    // 게시물 상세 조회
    @GetMapping("/{postId}")
    public String postDetail(@PathVariable Long postId, Model model) {
        try {
            log.debug("게시물 상세 조회 요청 - ID: {}", postId);
            Post post = postService.getPostByIdAndIncrementView(postId);
            model.addAttribute("post", post);
            log.debug("게시물 상세 조회 완료 - ID: {}, 제목: {}", postId, post.getTitle());
            return "post/detail";
        } catch (Exception e) {
            log.error("게시물 상세 조회 실패 - ID: {}", postId, e);
            model.addAttribute("error", "게시물을 불러오는 중 오류가 발생했습니다: " + e.getMessage());
            return "redirect:/posts";
        }
    }

    // 게시물 작성 폼
    @GetMapping("/new")
    public String postForm(
            @RequestParam("type") String type,
            @ModelAttribute("form") PostForm form,
            Model model,
            @AuthenticationPrincipal CustomUserDetails principal,
            RedirectAttributes redirectAttributes) {
        
        try {
            log.debug("게시물 작성 폼 요청 - 타입: {}, 사용자: {}", 
                    type, principal != null ? principal.getUsername() : "null");
            
            // 로그인 체크
            if (principal == null) {
                log.warn("게시물 작성 폼 접근 실패 - 로그인 필요");
                redirectAttributes.addFlashAttribute("error", "로그인이 필요합니다.");
                return "redirect:/login";
            }
            
            PostType postType = PostType.valueOf(type.toUpperCase());
            
            // 기관 요청 게시물 작성은 기관만 가능
            if (postType == PostType.ORGAN_REQUEST) {
                boolean hasOrganRole = principal.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_ORGAN"));
                if (!hasOrganRole) {
                    log.warn("게시물 작성 폼 접근 실패 - 기관 권한 없음, 사용자: {}", principal.getUsername());
                    redirectAttributes.addFlashAttribute("error", "기관 요청 게시물은 기관 회원만 작성할 수 있습니다.");
                    return "redirect:/posts/requests";
                }
            }
            
            form.setPostType(postType);
            model.addAttribute("postType", postType);
            model.addAttribute("isDonationReview", postType == PostType.DONATION_REVIEW);
            model.addAttribute("isOrganRequest", postType == PostType.ORGAN_REQUEST);
            model.addAttribute("cancelUrl", postType == PostType.DONATION_REVIEW ? "/posts/reviews" : "/posts/requests");
            log.debug("게시물 작성 폼 로드 완료 - 타입: {}", postType);
            return "post/new";
        } catch (IllegalArgumentException e) {
            log.error("게시물 작성 폼 로드 실패 - 잘못된 타입: {}", type, e);
            redirectAttributes.addFlashAttribute("error", "잘못된 게시물 타입입니다.");
            return "redirect:/posts";
        } catch (Exception e) {
            log.error("게시물 작성 폼 로드 실패 - 타입: {}", type, e);
            redirectAttributes.addFlashAttribute("error", "게시물 작성 폼을 불러오는 중 오류가 발생했습니다: " + e.getMessage());
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

        try {
            log.debug("게시물 작성 요청 - 타입: {}, 사용자: {}", 
                    form.getPostType(), principal != null ? principal.getUsername() : "null");

            // 로그인 체크
            if (principal == null) {
                log.warn("게시물 작성 실패 - 로그인 필요");
                redirectAttributes.addFlashAttribute("error", "로그인이 필요합니다.");
                return "redirect:/login";
            }

            // 기관 요청 게시물 작성은 기관만 가능
            if (form.getPostType() == PostType.ORGAN_REQUEST) {
                boolean hasOrganRole = principal.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_ORGAN"));
                if (!hasOrganRole) {
                    log.warn("게시물 작성 실패 - 기관 권한 없음, 사용자: {}", principal.getUsername());
                    redirectAttributes.addFlashAttribute("error", "기관 요청 게시물은 기관 회원만 작성할 수 있습니다.");
                    return "redirect:/posts/requests";
                }
            }

            if (bindingResult.hasErrors()) {
                log.warn("게시물 작성 실패 - 유효성 검사 오류, 사용자: {}", principal.getUsername());
                model.addAttribute("postType", form.getPostType());
                return "post/new";
            }

            User author = userService.findByUsername(principal.getUsername())
                    .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

            postService.createPost(author, form, form.getImage());
            log.info("게시물 작성 완료 - 타입: {}, 사용자: {}, 제목: {}", 
                    form.getPostType(), principal.getUsername(), form.getTitle());
            redirectAttributes.addFlashAttribute("success", "게시물이 작성되었습니다.");

            if (form.getPostType() == PostType.DONATION_REVIEW) {
                return "redirect:/posts/reviews";
            } else {
                return "redirect:/posts/requests";
            }
        } catch (IllegalArgumentException e) {
            log.error("게시물 작성 실패 - 잘못된 인자, 사용자: {}", 
                    principal != null ? principal.getUsername() : "null", e);
            redirectAttributes.addFlashAttribute("error", e.getMessage());
            model.addAttribute("postType", form.getPostType());
            return "post/new";
        } catch (IllegalStateException e) {
            log.error("게시물 작성 실패 - 사용자 없음, 사용자명: {}", 
                    principal != null ? principal.getUsername() : "null", e);
            redirectAttributes.addFlashAttribute("error", "사용자를 찾을 수 없습니다.");
            return "redirect:/posts";
        } catch (Exception e) {
            log.error("게시물 작성 실패 - 예상치 못한 오류, 사용자: {}", 
                    principal != null ? principal.getUsername() : "null", e);
            redirectAttributes.addFlashAttribute("error", "게시물 작성 중 오류가 발생했습니다: " + e.getMessage());
            model.addAttribute("postType", form.getPostType());
            return "post/new";
        }
    }

    // 게시물 수정 폼
    @GetMapping("/{postId}/edit")
    public String editForm(
            @PathVariable Long postId,
            @AuthenticationPrincipal CustomUserDetails principal,
            Model model,
            RedirectAttributes redirectAttributes) {
        try {
            log.debug("게시물 수정 폼 요청 - ID: {}, 사용자: {}", 
                    postId, principal != null ? principal.getUsername() : "null");

            Post post = postService.getPostById(postId);
            User user = userService.findByUsername(principal.getUsername())
                    .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

            // 작성자 확인
            if (!post.getAuthor().getId().equals(user.getId())) {
                log.warn("게시물 수정 폼 접근 실패 - 작성자 불일치, 게시물 ID: {}, 사용자: {}", 
                        postId, principal.getUsername());
                redirectAttributes.addFlashAttribute("error", "본인이 작성한 게시물만 수정할 수 있습니다.");
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

            log.debug("게시물 수정 폼 로드 완료 - ID: {}", postId);
            return "post/edit";
        } catch (IllegalStateException e) {
            log.error("게시물 수정 폼 로드 실패 - 사용자 없음, 게시물 ID: {}", postId, e);
            redirectAttributes.addFlashAttribute("error", "사용자를 찾을 수 없습니다.");
            return "redirect:/posts";
        } catch (Exception e) {
            log.error("게시물 수정 폼 로드 실패 - 게시물 ID: {}", postId, e);
            redirectAttributes.addFlashAttribute("error", "게시물 수정 폼을 불러오는 중 오류가 발생했습니다: " + e.getMessage());
            return "redirect:/posts/" + postId;
        }
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
        try {
            log.debug("게시물 수정 요청 - ID: {}, 사용자: {}", 
                    postId, principal != null ? principal.getUsername() : "null");

            if (bindingResult.hasErrors()) {
                log.warn("게시물 수정 실패 - 유효성 검사 오류, 게시물 ID: {}, 사용자: {}", 
                        postId, principal != null ? principal.getUsername() : "null");
                Post post = postService.getPostById(postId);
                model.addAttribute("post", post);
                model.addAttribute("postType", form.getPostType());
                return "post/edit";
            }

            User author = userService.findByUsername(principal.getUsername())
                    .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

            postService.updatePost(postId, author, form, form.getImage());
            log.info("게시물 수정 완료 - ID: {}, 사용자: {}, 제목: {}", 
                    postId, principal.getUsername(), form.getTitle());
            redirectAttributes.addFlashAttribute("success", "게시물이 수정되었습니다.");
            return "redirect:/posts/" + postId;
        } catch (IllegalStateException e) {
            log.error("게시물 수정 실패 - 사용자 없음, 게시물 ID: {}", postId, e);
            redirectAttributes.addFlashAttribute("error", "사용자를 찾을 수 없습니다.");
            return "redirect:/posts";
        } catch (IllegalArgumentException e) {
            log.error("게시물 수정 실패 - 잘못된 인자, 게시물 ID: {}", postId, e);
            redirectAttributes.addFlashAttribute("error", e.getMessage());
            Post post = postService.getPostById(postId);
            model.addAttribute("post", post);
            model.addAttribute("postType", form.getPostType());
            return "post/edit";
        } catch (Exception e) {
            log.error("게시물 수정 실패 - 예상치 못한 오류, 게시물 ID: {}", postId, e);
            redirectAttributes.addFlashAttribute("error", "게시물 수정 중 오류가 발생했습니다: " + e.getMessage());
            Post post = postService.getPostById(postId);
            model.addAttribute("post", post);
            model.addAttribute("postType", form.getPostType());
            return "post/edit";
        }
    }

    // 게시물 삭제
    @PostMapping("/{postId}/delete")
    public String deletePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal CustomUserDetails principal,
            RedirectAttributes redirectAttributes) {
        try {
            log.debug("게시물 삭제 요청 - ID: {}, 사용자: {}", 
                    postId, principal != null ? principal.getUsername() : "null");

            User author = userService.findByUsername(principal.getUsername())
                    .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));

            Post post = postService.getPostById(postId);
            PostType postType = post.getPostType();

            postService.deletePost(postId, author);
            log.info("게시물 삭제 완료 - ID: {}, 사용자: {}, 타입: {}", 
                    postId, principal.getUsername(), postType);
            redirectAttributes.addFlashAttribute("success", "게시물이 삭제되었습니다.");

            if (postType == PostType.DONATION_REVIEW) {
                return "redirect:/posts/reviews";
            } else {
                return "redirect:/posts/requests";
            }
        } catch (IllegalStateException e) {
            log.error("게시물 삭제 실패 - 사용자 없음, 게시물 ID: {}", postId, e);
            redirectAttributes.addFlashAttribute("error", "사용자를 찾을 수 없습니다.");
            return "redirect:/posts";
        } catch (IllegalArgumentException e) {
            log.error("게시물 삭제 실패 - 잘못된 인자, 게시물 ID: {}", postId, e);
            redirectAttributes.addFlashAttribute("error", e.getMessage());
            return "redirect:/posts/" + postId;
        } catch (Exception e) {
            log.error("게시물 삭제 실패 - 예상치 못한 오류, 게시물 ID: {}", postId, e);
            redirectAttributes.addFlashAttribute("error", "게시물 삭제 중 오류가 발생했습니다: " + e.getMessage());
            return "redirect:/posts/" + postId;
        }
    }
}