bits 64

section .note.GNU-stack noalloc noexec nowrite progbits

section .text
global strcasecmp

strcasecmp:
    mov     rax, 0              ; Initialize return value (starting address)
    mov     r11b, [rdi]         ; Load the byte at [rdi] into AL register
    mov     r10b, [rsi]
    jmp     loop_next_char

incrementer:
    inc     rdi
    inc     rsi
    jmp     loop_next_char

lower_the_char_frst_arg:
    cmp r11b, 65               ; Compare al with ASCII value of 'A'
    jl spot_1                  ; Jump if al is less than 'A'
    cmp r11b, 90               ; Compare al with ASCII value of 'Z'
    jg spot_1                  ; Jump if al is greater than 'Z'
    add r11b, 32
    jmp spot_1

lower_the_char_scnd_arg:
    cmp r10b, 65               ; Compare al with ASCII value of 'A'
    jl spot_2                  ; Jump if al is less than 'A'
    cmp r10b, 90               ; Compare al with ASCII value of 'Z'
    jg spot_2                  ; Jump if al is greater than 'Z'
    add r10b, 32
    jmp spot_2

loop_next_char:
    cmp     byte [rdi], 0      ; Check if the current byte is null terminator
    je      calculate_difference         ; If so, end
    mov     r11b, [rdi]        ; Load the byte at [rdi] into AL register
    mov     r10b, [rsi]
    jmp lower_the_char_frst_arg
spot_1:
    jmp lower_the_char_scnd_arg
spot_2:
    cmp     r11b, r10b          ; Compare the bytes
    jne     calculate_difference
    jmp     incrementer         ; Continue loop

calculate_difference:
    movsx   rax, byte [rdi]
    movsx   r10, byte [rsi]
    cmp     rax, 'a'
    jl      not_lowercase_rdi
    cmp     rax, 'z'
    jg      not_lowercase_rdi
    add     rax, 'A' - 'a'

not_lowercase_rdi:
    cmp     r10, 'a'
    jl      not_lowercase_rsi
    cmp     r10, 'z'
    jg      not_lowercase_rsi
    add     r10, 'A' - 'a'

not_lowercase_rsi:
    sub     rax, r10
    ret
