package com.football.team.dto.res;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data @Builder
public class MemberFeeRes {
    private Long userId;
    private String nickname;
    private BigDecimal amountDue;
    private BigDecimal amountPaid;
    private boolean isPaid;
}
