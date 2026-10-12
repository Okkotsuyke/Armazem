# ============================================================
# GitHub Branch Protection Rules
# Aplicar via: Settings → Branches → Branch protection rules
# ============================================================

# Para branch `main`:

{
  "protection_rule": {
    "pattern": "main",
    "required_status_checks": {
      "strict": true,
      "contexts": ["lint", "db-check", "build"]
    },
    "enforce_admins": true,
    "required_pull_request_reviews": {
      "required_approving_review_count": 1,
      "dismiss_stale_reviews": true,
      "require_code_owner_reviews": false
    },
    "restrictions": null,
    "require_linear_history": true,
    "allow_force_pushes": false,
    "allow_deletions": false,
    "block_creations": false,
    "required_conversation_resolution": true
  }
}

# Para branch `develop`:

{
  "protection_rule": {
    "pattern": "develop",
    "required_status_checks": {
      "strict": false,
      "contexts": ["lint", "db-check", "build"]
    },
    "enforce_admins": false,
    "required_pull_request_reviews": {
      "required_approving_review_count": 0,
      "dismiss_stale_reviews": true,
      "require_code_owner_reviews": false
    },
    "restrictions": null,
    "require_linear_history": false,
    "allow_force_pushes": true,
    "allow_deletions": false
  }
}

# ===========================================
# Para configurar via GitHub CLI (gh):
# ===========================================

# Instalar gh se não tiver
# brew install gh

# Login
# gh auth login

# Criar rules para main
# gh api repos/:owner/:repo/branches/main/protection \
#   -X PUT \
#   -f required_status_checks='{"strict":true,"contexts":["lint","build"]}' \
#   -f enforce_admins=true \
#   -f required_pull_request_reviews='{"required_approving_review_count":1}' \
#   -f allow_force_pushes=false

# ===========================================
# Via Terraform (recomendado para IaC):
# ===========================================

# resource "github_branch_protection" "main" {
#   repository_id  = github_repository.main.id
#   pattern        = "main"
#   
#   required_status_checks {
#     strict   = true
#     contexts = ["lint", "build", "db-check"]
#   }
#   
#   required_pull_request_reviews {
#     required_approving_review_count = 1
#     dismiss_stale_reviews           = true
#   }
#   
#   enforce_admins      = true
#   allow_force_pushes  = false
# }
