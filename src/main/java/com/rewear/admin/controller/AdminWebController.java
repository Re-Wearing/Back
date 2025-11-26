package com.rewear.admin.controller;

import com.rewear.admin.service.AdminServiceImpl;
import com.rewear.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Controller
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminWebController {

    private final AdminServiceImpl adminService;

    @GetMapping
    public String root() { return "redirect:/admin/dashboard"; }

    @GetMapping("/dashboard")
    public String dashboard() { return "admin/dashboard"; }

    @GetMapping("/users")
    public String showAllUsers(Model model) {
        List<User> users = adminService.getAllUsers();
        if (users == null || users.isEmpty()) {
            model.addAttribute("users", List.of());  // 빈 리스트라도 넣기
        } else {
            model.addAttribute("users", users);
        }
        return "admin/users-list";
    }

    @GetMapping("/users/delete/{id}")
    public String deleteUser(@PathVariable Long id) {
        adminService.deleteUserById(id);
        return "redirect:/admin/users";
    }

}
