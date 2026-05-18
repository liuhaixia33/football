-- team_member
ALTER TABLE `team_member`
  ADD CONSTRAINT `fk_tm_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_tm_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

-- activity
ALTER TABLE `activity`
  ADD CONSTRAINT `fk_act_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_act_creator` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`);

-- activity_registration
ALTER TABLE `activity_registration`
  ADD CONSTRAINT `fk_reg_activity` FOREIGN KEY (`activity_id`) REFERENCES `activity` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_reg_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

-- match_result
ALTER TABLE `match_result`
  ADD CONSTRAINT `fk_mr_activity` FOREIGN KEY (`activity_id`) REFERENCES `activity` (`id`) ON DELETE CASCADE;

-- finance_record
ALTER TABLE `finance_record`
  ADD CONSTRAINT `fk_fr_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_fr_creator` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`);

-- member_fee
ALTER TABLE `member_fee`
  ADD CONSTRAINT `fk_mf_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_mf_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;
