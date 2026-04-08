using Microsoft.AspNetCore.Identity;

namespace Backend.Data;

public class ApplicationUser : IdentityUser
{
    public int? SupporterId { get; set; }
}
