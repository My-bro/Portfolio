bits 64

section .note.GNU-stack noalloc noexec nowrite progbits

section .text
global strcspn

strcspn:
    xor     rax, rax
    cmp     byte [rdi], 0       ; Check if the first byte is null terminator
    je      end_func
    jmp     loop_next_char

loop_next_char:
    cmp     byte [rdi], 0     ; Check if the current byte is null terminator
    je      end_func
    mov     r10, rdi
    mov     r11, rsi
    jne     check_if_two_str_same         ; Continue loop

check_if_two_str_same:
    cmp     byte [r11], 0       ; Check if the current byte is null terminator
    je      str_is_not_present  ; If so, end
    cmp     byte [r10], 0       ; Check if the current byte is null terminator
    je      end_func            ; If so, end
    mov     r12b, [r11]
    cmp     r12b, [r10]
    je      end_func
    inc     r11
    jmp check_if_two_str_same

str_is_not_present:
    inc rdi
    inc rax
    jmp loop_next_char

end_func:
    ret
